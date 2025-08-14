import {
  users,
  projects,
  tasks,
  projectMembers,
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type Task,
  type InsertTask,
  type ProjectMember,
  type InsertProjectMember,
  type ProjectWithMembers,
  type TaskWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project operations
  getProject(id: string): Promise<Project | undefined>;
  getProjectWithMembers(id: string): Promise<ProjectWithMembers | undefined>;
  getUserProjects(userId: string): Promise<ProjectWithMembers[]>;
  createProject(project: InsertProject & { createdBy: string }): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  getProjectByInviteCode(inviteCode: string): Promise<Project | undefined>;

  // Project member operations
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  removeProjectMember(projectId: string, userId: string): Promise<boolean>;
  getUserProjectRole(projectId: string, userId: string): Promise<string | undefined>;
  getProjectMembers(projectId: string): Promise<(ProjectMember & { user: User })[]>;

  // Task operations
  getTask(id: string): Promise<TaskWithDetails | undefined>;
  getProjectTasks(projectId: string): Promise<TaskWithDetails[]>;
  getUserTasks(userId: string): Promise<TaskWithDetails[]>;
  createTask(task: InsertTask & { createdBy: string }): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Project operations
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectWithMembers(id: string): Promise<ProjectWithMembers | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!project) return undefined;

    const members = await db
      .select()
      .from(projectMembers)
      .leftJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, id));

    const projectTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, id));

    const [creator] = await db
      .select()
      .from(users)
      .where(eq(users.id, project.createdBy));

    return {
      ...project,
      members: members.map(m => ({
        ...m.project_members,
        user: m.users!,
      })),
      tasks: projectTasks,
      creator,
    };
  }

  async getUserProjects(userId: string): Promise<ProjectWithMembers[]> {
    const userProjectIds = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));

    const projectIds = userProjectIds.map(p => p.projectId);
    
    if (projectIds.length === 0) return [];

    const userProjects = await db
      .select()
      .from(projects)
      .where(or(...projectIds.map(id => eq(projects.id, id))))
      .orderBy(desc(projects.updatedAt));

    const results: ProjectWithMembers[] = [];
    
    for (const project of userProjects) {
      const members = await db
        .select()
        .from(projectMembers)
        .leftJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, project.id));

      const projectTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, project.id));

      const [creator] = await db
        .select()
        .from(users)
        .where(eq(users.id, project.createdBy));

      results.push({
        ...project,
        members: members.map(m => ({
          ...m.project_members,
          user: m.users!,
        })),
        tasks: projectTasks,
        creator,
      });
    }

    return results;
  }

  async createProject(projectData: InsertProject & { createdBy: string }): Promise<Project> {
    const inviteCode = this.generateInviteCode();
    
    const [project] = await db
      .insert(projects)
      .values({ ...projectData, inviteCode })
      .returning();

    // Add creator as owner
    await db.insert(projectMembers).values({
      projectId: project.id,
      userId: projectData.createdBy,
      role: "owner",
    });

    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    
    return project;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getProjectByInviteCode(inviteCode: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.inviteCode, inviteCode));
    return project;
  }

  // Project member operations
  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const [projectMember] = await db
      .insert(projectMembers)
      .values(member)
      .returning();
    return projectMember;
  }

  async removeProjectMember(projectId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      );
    return (result.rowCount || 0) > 0;
  }

  async getUserProjectRole(projectId: string, userId: string): Promise<string | undefined> {
    const [member] = await db
      .select({ role: projectMembers.role })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      );
    return member?.role;
  }

  async getProjectMembers(projectId: string): Promise<(ProjectMember & { user: User })[]> {
    const members = await db
      .select()
      .from(projectMembers)
      .leftJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId));

    return members.map(m => ({
      ...m.project_members,
      user: m.users!,
    }));
  }

  // Task operations
  async getTask(id: string): Promise<TaskWithDetails | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, id));

    if (!task) return undefined;

    const [creator] = await db
      .select()
      .from(users)
      .where(eq(users.id, task.tasks.createdBy));

    return {
      ...task.tasks,
      assignee: task.users || undefined,
      creator,
      project: task.projects!,
    };
  }

  async getProjectTasks(projectId: string): Promise<TaskWithDetails[]> {
    const projectTasks = await db
      .select()
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.createdAt));

    const results: TaskWithDetails[] = [];
    
    for (const task of projectTasks) {
      const [creator] = await db
        .select()
        .from(users)
        .where(eq(users.id, task.tasks.createdBy));

      results.push({
        ...task.tasks,
        assignee: task.users || undefined,
        creator,
        project: task.projects!,
      });
    }

    return results;
  }

  async getUserTasks(userId: string): Promise<TaskWithDetails[]> {
    const userTasks = await db
      .select()
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.assigneeId, userId))
      .orderBy(desc(tasks.createdAt));

    const results: TaskWithDetails[] = [];
    
    for (const task of userTasks) {
      const [creator] = await db
        .select()
        .from(users)
        .where(eq(users.id, task.tasks.createdBy));

      results.push({
        ...task.tasks,
        assignee: task.users || undefined,
        creator,
        project: task.projects!,
      });
    }

    return results;
  }

  async createTask(taskData: InsertTask & { createdBy: string }): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    
    return task;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount || 0) > 0;
  }

  private generateInviteCode(): string {
    return randomBytes(8).toString('hex').toUpperCase();
  }
}

export const storage = new DatabaseStorage();
