<?php

namespace App\Console\Commands;

use App\Enums\Permission;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission as PermissionModel;

class SyncPermissions extends Command
{
    protected $signature = 'permissions:sync
        {--seed : Also seed roles after syncing permissions}';

    protected $description = 'Sync all permissions defined in the Permission enum to the database';

    public function handle(): int
    {
        $this->info('Syncing permissions from enum...');

        $created = 0;
        $existing = 0;

        foreach (Permission::cases() as $permission) {
            PermissionModel::firstOrCreate([
                'name' => $permission->value,
                'guard_name' => 'web',
            ])
                ? $created++
                : $existing++;
        }

        $this->info("Created {$created} permissions ({$existing} already existed).");

        if ($this->option('seed')) {
            $this->call('db:seed', ['--class' => 'Database\\Seeders\\RolePermissionSeeder']);
        }

        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        $this->info('Permission cache flushed.');

        return self::SUCCESS;
    }
}
