"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app/app.module"); // Ensure this path is correct
const common_1 = require("@nestjs/common");
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const fs = tslib_1.__importStar(require("fs"));
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const appInstance = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = appInstance.get(config_1.ConfigService);
    const NODE_ENV = configService.get('NODE_ENV') || 'development';
    const isProduction = NODE_ENV === 'production';
    const HOST = isProduction ? 'jeffreysanford.us' : 'localhost';
    const PORT = configService.get('NEST_PORT') || 3000;
    const protocol = isProduction ? 'https' : 'http';
    common_1.Logger.log(`Starting server in ${NODE_ENV} mode`);
    common_1.Logger.log(`Host: ${HOST}, Port: ${PORT}`);
    const httpsOptions = isProduction ? {
        key: fs.readFileSync('/etc/letsencrypt/live/jeffreysanford.us/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/jeffreysanford.us/fullchain.pem'),
    } : undefined;
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        httpsOptions
    });
    // Set global prefix for all routes
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: ['https://www.jeffreysanford.us', 'http://localhost:4200'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        maxAge: 3600
    });
    app.use((0, helmet_1.default)());
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('API Documentation')
        .setDescription('API description')
        .setVersion('1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/api-docs', app, document);
    common_1.Logger.log('Swagger is set up at /api/api-docs');
    await app.listen(PORT, HOST);
    common_1.Logger.log(`Server running on ${protocol}://${HOST}:${PORT}`);
}
bootstrap();
//# sourceMappingURL=main.js.map