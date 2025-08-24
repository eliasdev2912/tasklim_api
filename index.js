const app = require('./app.js')




const port = 3000;

app.listen(port, () => {
    const now = new Date().toISOString();
    const host = process.env.HOST || 'localhost';
    const env = process.env.NODE_ENV || 'development';
    const pid = process.pid;
    const version = process.env.npm_package_version || 'unknown';

    const url = `http://${host}:${port}`;

    console.log('═'.repeat(30));
    console.log(`🚀 Server started`);
    console.log(`- Port: ${port}`);
    console.log(`- Host: ${host}`);
    console.log(`- URL: ${url}`);
    console.log(`- PID: ${pid}`);
    console.log(`- Environment: ${env}`);
    console.log(`- Version: ${version}`);
    console.log(`- Started at: ${now}`);
    console.log(`- Database: ${process.env.DB_NAME}`)
    console.log('═'.repeat(30));
});
