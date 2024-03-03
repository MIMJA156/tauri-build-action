import * as fs from 'fs';
import * as path from 'path';

export function printDirectoryTree(dirPath: string, indent: string = '', maxDepth: number = Infinity, currentDepth: number = 0): void {
    if (currentDepth > maxDepth) {
        return;
    }

    const files: string[] = fs.readdirSync(dirPath);

    files.forEach(file => {
        const filePath: string = path.join(dirPath, file);
        const stats: fs.Stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            console.log(indent + '|-- ' + file + ' (Dir)');
            printDirectoryTree(filePath, indent + '   ', maxDepth, currentDepth + 1);
        } else {
            console.log(indent + '|-- ' + file);
        }
    });
}