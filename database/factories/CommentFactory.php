<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CommentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'body' => fake()->paragraph(),
            'task_id' => Task::factory(),
            'author_id' => User::factory(),
            'project_id' => null,
            'parent_id' => null,
        ];
    }
}
