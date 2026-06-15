<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AnnouncementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(),
            'content' => fake()->paragraphs(3, true),
            'priority' => fake()->randomElement(['low', 'medium', 'high', 'urgent']),
            'author_id' => User::factory(),
            'published_at' => now(),
        ];
    }
}
