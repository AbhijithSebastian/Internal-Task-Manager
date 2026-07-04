<?php

namespace Database\Factories;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'status' => TaskStatus::Backlog,
            'priority' => fake()->randomElement(TaskPriority::cases()),
            'due_date' => fake()->dateTimeBetween('now', '+2 weeks'),
            'estimated_hours' => fake()->randomFloat(1, 1, 40),
            'project_id' => Project::factory(),
            'author_id' => User::factory(),
            'parent_id' => null,
        ];
    }
}
