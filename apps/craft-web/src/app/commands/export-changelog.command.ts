import { LoggerService } from '../common/services/logger.service';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import { Observable, from, of } from 'rxjs';
import { map, mergeMap, tap, catchError } from 'rxjs/operators';

interface Command {
    name: string;
    description: string;
    run(): Observable<void>;
}

export class ExportChangelogCommand implements Command {
    name = 'export-changelog';
    description = 'Export changelog entries from logger service';
    
    constructor(private loggerService: LoggerService) {}
    
    run(): Observable<void> {
        const entries = this.loggerService.getChangelogEntries();
        
        // Create temp directory if it doesn't exist
        const tempDir = path.resolve(process.cwd(), '.temp');
        const outputPath = path.resolve(tempDir, 'changelog-entries.json');
        
        return of(tempDir).pipe(
            mergeMap(dir => {
                if (!fs.existsSync(dir)) {
                    return from(fsPromises.mkdir(dir, { recursive: true }));
                }
                return of(undefined);
            }),
            mergeMap(() => from(fsPromises.writeFile(outputPath, JSON.stringify(entries, null, 2)))),
            tap(() => {
                console.log(`Exported ${entries.length} changelog entries to ${outputPath}`);
                // Clear entries after export
                this.loggerService.clearChangelogEntries();
            }),
            catchError(error => {
                console.error('Failed to export changelog:', error);
                return of(undefined);
            }),
            map(() => void 0)
        );
    }
}
