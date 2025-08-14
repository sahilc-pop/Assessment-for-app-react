import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertProjectSchema, insertTaskSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Project permission middleware
const checkProjectPermission = async (req: any, res: any, next: any) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    const role = await storage.getUserProjectRole(projectId, userId);
    if (!role) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }
    
    req.userProjectRole = role;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking project permissions' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        // Handle different message types (join project room, etc.)
        if (data.type === 'join_project') {
          // Add WebSocket to project room (implement room management)
          ws.send(JSON.stringify({ type: 'joined_project', projectId: data.projectId }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (projectId: string, data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ projectId, ...data }));
      }
    });
  };

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Generate JWT
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '7d',
      });
      
      res.status(201).json({
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Generate JWT
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '7d',
      });
      
      res.json({
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user data' });
    }
  });

  // Project routes
  app.get('/api/projects', authenticateToken, async (req: any, res) => {
    try {
      const projects = await storage.getUserProjects(req.user.id);
      res.json(projects);
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  });

  app.post('/api/projects', authenticateToken, async (req: any, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      
      const project = await storage.createProject({
        ...projectData,
        createdBy: req.user.id,
      });
      
      // Get the full project with members
      const fullProject = await storage.getProjectWithMembers(project.id);
      
      res.status(201).json(fullProject);
    } catch (error) {
      console.error('Create project error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create project' });
    }
  });

  app.get('/api/projects/:projectId', authenticateToken, checkProjectPermission, async (req: any, res) => {
    try {
      const project = await storage.getProjectWithMembers(req.params.projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      res.json(project);
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ message: 'Failed to fetch project' });
    }
  });

  app.put('/api/projects/:projectId', authenticateToken, checkProjectPermission, async (req: any, res) => {
    try {
      // Only owner can update project
      if (req.userProjectRole !== 'owner') {
        return res.status(403).json({ message: 'Only project owners can update projects' });
      }
      
      const updates = req.body;
      delete updates.id; // Prevent ID changes
      delete updates.createdBy; // Prevent ownership changes
      delete updates.inviteCode; // Prevent invite code changes
      
      const project = await storage.updateProject(req.params.projectId, updates);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Broadcast update to project members
      broadcast(req.params.projectId, { type: 'project_updated', project });
      
      res.json(project);
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ message: 'Failed to update project' });
    }
  });

  app.delete('/api/projects/:projectId', authenticateToken, checkProjectPermission, async (req: any, res) => {
    try {
      // Only owner can delete project
      if (req.userProjectRole !== 'owner') {
        return res.status(403).json({ message: 'Only project owners can delete projects' });
      }
      
      const success = await storage.deleteProject(req.params.projectId);
      if (!success) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ message: 'Failed to delete project' });
    }
  });

  app.post('/api/projects/join', authenticateToken, async (req: any, res) => {
    try {
      const { inviteCode } = req.body;
      
      if (!inviteCode) {
        return res.status(400).json({ message: 'Invite code required' });
      }
      
      const project = await storage.getProjectByInviteCode(inviteCode);
      if (!project) {
        return res.status(404).json({ message: 'Invalid invite code' });
      }
      
      // Check if user is already a member
      const existingRole = await storage.getUserProjectRole(project.id, req.user.id);
      if (existingRole) {
        return res.status(400).json({ message: 'Already a member of this project' });
      }
      
      // Add user as member
      await storage.addProjectMember({
        projectId: project.id,
        userId: req.user.id,
        role: 'member',
      });
      
      // Get full project data
      const fullProject = await storage.getProjectWithMembers(project.id);
      
      // Broadcast new member to existing members
      broadcast(project.id, { type: 'member_joined', project: fullProject });
      
      res.json(fullProject);
    } catch (error) {
      console.error('Join project error:', error);
      res.status(500).json({ message: 'Failed to join project' });
    }
  });

  // My Tasks route
  app.get('/api/my-tasks', authenticateToken, async (req: any, res) => {
    try {
      const tasks = await storage.getUserTasks(req.user.id);
      res.json(tasks);
    } catch (error) {
      console.error('Get user tasks error:', error);
      res.status(500).json({ message: 'Failed to fetch user tasks' });
    }
  });

  // Task routes
  app.get('/api/projects/:projectId/tasks', authenticateToken, checkProjectPermission, async (req: any, res) => {
    try {
      const tasks = await storage.getProjectTasks(req.params.projectId);
      res.json(tasks);
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ message: 'Failed to fetch tasks' });
    }
  });

  app.post('/api/projects/:projectId/tasks', authenticateToken, checkProjectPermission, async (req: any, res) => {
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        projectId: req.params.projectId,
      });
      
      const task = await storage.createTask({
        ...taskData,
        createdBy: req.user.id,
      });
      
      // Get full task details
      const fullTask = await storage.getTask(task.id);
      
      // Broadcast new task to project members
      broadcast(req.params.projectId, { type: 'task_created', task: fullTask });
      
      res.status(201).json(fullTask);
    } catch (error) {
      console.error('Create task error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create task' });
    }
  });

  app.put('/api/tasks/:taskId', authenticateToken, async (req: any, res) => {
    try {
      const task = await storage.getTask(req.params.taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user has access to the project
      const role = await storage.getUserProjectRole(task.projectId, req.user.id);
      if (!role) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Members can only edit tasks assigned to them or tasks they created
      if (role === 'member' && task.assigneeId !== req.user.id && task.createdBy !== req.user.id) {
        return res.status(403).json({ message: 'Can only edit your own tasks' });
      }
      
      const updates = req.body;
      delete updates.id; // Prevent ID changes
      delete updates.projectId; // Prevent project changes
      delete updates.createdBy; // Prevent creator changes
      
      const updatedTask = await storage.updateTask(req.params.taskId, updates);
      if (!updatedTask) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Get full task details
      const fullTask = await storage.getTask(updatedTask.id);
      
      // Broadcast task update to project members
      broadcast(task.projectId, { type: 'task_updated', task: fullTask });
      
      res.json(fullTask);
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ message: 'Failed to update task' });
    }
  });

  // PATCH endpoint for task status updates (used by drag-and-drop)
  app.patch('/api/projects/:projectId/tasks/:taskId', authenticateToken, async (req: any, res) => {
    try {
      const task = await storage.getTask(req.params.taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user has access to the project
      const role = await storage.getUserProjectRole(req.params.projectId, req.user.id);
      if (!role) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Allow all project members to update task status (for drag-and-drop)
      const updates = req.body;
      delete updates.id; // Prevent ID changes
      delete updates.projectId; // Prevent project changes
      delete updates.createdBy; // Prevent creator changes
      
      const updatedTask = await storage.updateTask(req.params.taskId, updates);
      if (!updatedTask) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Get full task details
      const fullTask = await storage.getTask(updatedTask.id);
      
      // Broadcast task update to project members
      broadcast(task.projectId, { type: 'task_updated', task: fullTask });
      
      res.json(fullTask);
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ message: 'Failed to update task' });
    }
  });

  app.delete('/api/tasks/:taskId', authenticateToken, async (req: any, res) => {
    try {
      const task = await storage.getTask(req.params.taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if user has access to the project
      const role = await storage.getUserProjectRole(task.projectId, req.user.id);
      if (!role) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Only owners and task creators can delete tasks
      if (role !== 'owner' && task.createdBy !== req.user.id) {
        return res.status(403).json({ message: 'Only project owners and task creators can delete tasks' });
      }
      
      const success = await storage.deleteTask(req.params.taskId);
      if (!success) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Broadcast task deletion to project members
      broadcast(task.projectId, { type: 'task_deleted', taskId: req.params.taskId });
      
      res.status(204).send();
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ message: 'Failed to delete task' });
    }
  });

  return httpServer;
}
