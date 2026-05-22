<?php

namespace Database\Factories;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'description' => fake()->paragraph(),
            'status' => ProjectStatus::Active,
            'priority' => fake()->randomElement(ProjectPriority::cases()),
            'start_date' => fake()->dateTimeBetween('-1 month', 'now'),
            'end_date' => fake()->dateTimeBetween('now', '+3 months'),
            'author_id' => User::factory(),
            'pm_id' => User::factory(),
            'lead_id' => User::factory(),
        ];
    }
}
