<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super-admin';
    case ProjectManager = 'project-manager';
    case TeamLead = 'team-lead';
    case Employee = 'employee';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::ProjectManager => 'Project Manager',
            self::TeamLead => 'Team Lead',
            self::Employee => 'Employee',
        };
    }

    public static function selectOptions(): array
    {
        return collect(self::cases())->map(fn ($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ])->toArray();
    }
}
