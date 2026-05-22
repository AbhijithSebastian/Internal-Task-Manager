<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class BackupDatabase extends Command
{
    protected $signature = 'backup:database
        {--path= : Output path for the backup file}
        {--compress : Compress with gzip (default: uses config)}
        {--no-compress : Skip compression}
        {--keep= : Number of backups to retain}';

    protected $description = 'Backup the PostgreSQL database with rotation';

    public function handle(): int
    {
        $config = config('monitoring.backup');
        $backupPath = $this->option('path') ?? $config['path'];
        $retentionDays = (int) ($this->option('keep') ?? $config['retention_days']);
        $compress = $this->option('no-compress') ? false : ($this->option('compress') ?? $config['compress']);

        $db = config('database.connections.pgsql');
        $timestamp = now()->format('Y-m-d_Hi');
        $filename = "{$db['database']}_{$timestamp}.sql";
        $fullPath = rtrim($backupPath, '/') . '/' . $filename;

        if (!is_dir(dirname($fullPath))) {
            mkdir(dirname($fullPath), 0755, true);
        }

        $this->components->task('Dumping database', function () use ($db, $fullPath, $compress) {
            $command = sprintf(
                'PGPASSWORD=%s pg_dump --host=%s --port=%s --username=%s --dbname=%s --no-owner --no-acl %s',
                escapeshellarg($db['password']),
                escapeshellarg($db['host']),
                escapeshellarg($db['port']),
                escapeshellarg($db['username']),
                escapeshellarg($db['database']),
                $compress ? '| gzip' : ''
            );

            $outputFile = $compress ? "{$fullPath}.gz" : $fullPath;
            $command .= $compress ? " > {$outputFile}" : " > {$outputFile}";

            $output = null;
            $returnCode = null;
            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new \RuntimeException('pg_dump failed with code ' . $returnCode);
            }

            return $outputFile;
        });

        $actualFile = $compress ? "{$fullPath}.gz" : $fullPath;
        $size = file_exists($actualFile) ? round(filesize($actualFile) / 1048576, 2) : 0;

        $this->components->twoColumnDetail('File', basename($actualFile));
        $this->components->twoColumnDetail('Size', "{$size} MB");

        // ─── Rotate old backups ─────────────────────────────────────────────────
        $cutoff = now()->subDays($retentionDays);
        $deleted = 0;
        $pattern = rtrim($backupPath, '/') . '/' . $db['database'] . '_*.sql*';

        foreach (glob($pattern) as $oldFile) {
            if (filemtime($oldFile) < $cutoff->timestamp) {
                unlink($oldFile);
                $deleted++;
            }
        }

        if ($deleted > 0) {
            $this->components->task("Cleaned {$deleted} backup(s) older than {$retentionDays} days");
        }

        Log::info('Database backup completed', [
            'file' => $actualFile,
            'size_mb' => $size,
            'retention_days' => $retentionDays,
            'deleted_old' => $deleted,
        ]);

        return self::SUCCESS;
    }
}
