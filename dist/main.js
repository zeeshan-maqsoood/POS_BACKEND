"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./src/config"));
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const socket_service_1 = require("./src/services/socket.service");
const prisma = new client_1.PrismaClient();
const port = config_1.default.port;
let server;
async function ensureAdminUser() {
    try {
        // Check if admin user already exists
        const adminExists = await prisma.user.findFirst({
            where: {
                email: 'admin@example.com',
                role: client_1.UserRole.ADMIN
            }
        });
        if (!adminExists) {
            console.log('No admin user found. Creating one...');
            const hashedPassword = await bcrypt_1.default.hash('admin123', 10);
            // Create admin user
            const adminUser = await prisma.user.create({
                data: {
                    email: 'admin@example.com',
                    password: hashedPassword,
                    role: client_1.UserRole.ADMIN,
                    name: 'Admin User'
                }
            });
            // Add all permissions to admin
            const permissions = Object.values(client_2.Permission);
            await Promise.all(permissions.map(permission => prisma.userPermission.create({
                data: {
                    userId: adminUser.id,
                    permission: permission
                }
            })));
            console.log('Admin user created successfully with all permissions');
        }
        else {
            console.log('Admin user already exists');
        }
    }
    catch (error) {
        console.error('Error ensuring admin user:', error);
    }
}
// Start the server
async function startServer() {
    try {
        // Ensure admin user exists
        await ensureAdminUser();
        // Start the server
        server = app_1.default.listen(port, () => {
            console.log(`🚀 Server running on http://localhost:${port}`);
        });
        const io = (0, socket_service_1.initializeSocket)(server);
        return io;
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    console.log(err.name, err.message);
    if (server) {
        server.close(() => {
            console.log('Server closed due to unhandled rejection');
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    console.log(err.name, err.message);
    process.exit(1);
});
// Import Permission enum after prisma client is initialized
const client_2 = require("@prisma/client");
// Start the application
startServer();
//# sourceMappingURL=main.js.map