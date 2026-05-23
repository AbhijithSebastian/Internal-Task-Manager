<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'admin@internaltool.com',
            'password' => bcrypt('password'),
        ]);
        $superAdmin->assignRole(UserRole::SuperAdmin->value);

        $projectManager = User::factory()->create([
            'name' => 'Project Manager',
            'email' => 'pm@internaltool.com',
            'password' => bcrypt('password'),
        ]);
        $projectManager->assignRole(UserRole::ProjectManager->value);

        $teamLead = User::factory()->create([
            'name' => 'Team Lead',
            'email' => 'lead@internaltool.com',
            'password' => bcrypt('password'),
        ]);
        $teamLead->assignRole(UserRole::TeamLead->value);

        $employee = User::factory()->create([
            'name' => 'Employee One',
            'email' => 'employee@internaltool.com',
            'password' => bcrypt('password'),
        ]);
        $employee->assignRole(UserRole::Employee->value);

        $names = ['Cincy', 'Tojin', 'Geo', 'Divya', 'Abhijith', 'Rojan'];
        foreach ($names as $name) {
            $user = User::factory()->create([
                'name' => $name,
                'email' => strtolower($name) . '@internaltool.com',
                'password' => bcrypt('password'),
            ]);
            if ($name === 'Abhijith') {
                $user->assignRole(UserRole::SuperAdmin->value);
            } else {
                $user->assignRole(UserRole::Employee->value);
            }
        }
    }
}
