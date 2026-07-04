<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class RestoreDatabase extends Command
{
    protected $signature = 'backup:restore
        {file? : Path to the backup SQL file (.sql or .sql.gz) — relative to backups disk or absolute}
        {--list : List available backups and exit}
        {--force : Skip confirmation prompt}';

    protected $description = 'Restore the PostgreSQL database from a backup file';

    public function handle(): int
    {
        if ($this->option('list')) {
            return $this->listBackups();
        }

        $file = $this->argument('file');

        if (!$file) {
            $this->components->error('No file specified. Use --list to see available backups.');
            return self::FAILURE;
        }

        $resolvedPath = $this->resolvePath($file);

        if (!$resolvedPath || !file_exists($resolvedPath)) {
            $this->components->error("File not found: {$file}");
            return self::FAILURE;
        }

        $isCompressed = str_ends_with($resolvedPath, '.gz');

        if (!$this->option('force')) {
            $size = round(filesize($resolvedPath) / 1048576, 1);
            $label = $isCompressed ? ' (gzipped)' : '';
            $warning = "This will OVERWRITE the current database with data from:\n  {$resolvedPath} ({$size} MB{$label})";

            if (!$this->components->confirm($warning)) {
                $this->info('Restore cancelled.');
                return self::SUCCESS;
            }
        }

        $db = config('database.connections.pgsql');
        $this->components->task('Restoring database', function () use ($db, $resolvedPath, $isCompressed) {
            $command = sprintf(
                'PGPASSWORD=%s psql --host=%s --port=%s --username=%s --dbname=%s',
                escapeshellarg($db['password']),
                escapeshellarg($db['host']),
                escapeshellarg($db['port']),
                escapeshellarg($db['username']),
                escapeshellarg($db['database'])
            );

            if ($isCompressed) {
                $command = "gunzip -c {$resolvedPath} | {$command}";
            } else {
                $command = "{$command} < {$resolvedPath}";
            }

            $output = null;
            $returnCode = null;
            exec($command . ' 2>&1', $output, $returnCode);

            if ($returnCode !== 0) {
                throw new \RuntimeException('Restore failed: ' . implode("\n", array_slice($output, -5)));
            }
        });

        $this->components->success('Database restored successfully.');

        return self::SUCCESS;
    }

    protected function resolvePath(string $file): ?string
    {
        if (str_starts_with($file, '/')) {
            return $file;
        }

        $disk = Storage::disk('local');
        $onDisk = $disk->path($file);

        if (file_exists($onDisk)) {
            return $onDisk;
        }

        $backupPath = config('monitoring.backup.path');
        $inBackup = rtrim($backupPath, '/') . '/' . ltrim($file, '/');

        if (file_exists($inBackup)) {
            return $inBackup;
        }

        return null;
    }

    protected function listBackups(): int
    {
        $backupPath = config('monitoring.backup.path');
        $pattern = rtrim($backupPath, '/') . '/*.sql*';

        $files = glob($pattern);

        if (empty($files)) {
            $this->components->info('No backups found.');
            return self::SUCCESS;
        }

        $this->components->twoColumnDetail('Available backups', 'Size');

        $rows = [];
        foreach ($files as $file) {
            $size = round(filesize($file) / 1048576, 2);
            $filename = basename($file);
            $rows[] = [$filename, "{$size} MB"];
        }

        rsort($rows);
        foreach ($rows as $row) {
            $this->components->twoColumnDetail($row[0], $row[1]);
        }

        $this->line('');
        $this->line('To restore: php artisan backup:restore ' . $rows[0][0]);

        return self::SUCCESS;
    }
}
