<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

class IntegrationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'type' => 'github',
            'label' => fake()->words(2, true),
            'config' => ['repo' => fake()->word() . '/' . fake()->word()],
            'is_active' => true,
        ];
    }

    public function github(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'github',
            'config' => ['repo' => fake()->word() . '/' . fake()->word()],
        ]);
    }

    public function figma(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'figma',
            'config' => ['file_key' => fake()->uuid()],
        ]);
    }

    public function emailHook(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'email_hook',
            'config' => ['inbound_email' => fake()->email()],
        ]);
    }
}
