<?php

namespace Tests\Feature;

use Tests\TestCase;

class DashboardTest extends TestCase
{
    public function test_super_admin_can_view_dashboard(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->get(route('dashboard', absolute: false));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Dashboard/Index'));
    }

    public function test_project_manager_can_view_dashboard(): void
    {
        $this->actingAsProjectManager();

        $response = $this->get(route('dashboard', absolute: false));

        $response->assertStatus(200);
    }

    public function test_team_lead_can_view_dashboard(): void
    {
        $this->actingAsTeamLead();

        $response = $this->get(route('dashboard', absolute: false));

        $response->assertStatus(200);
    }

    public function test_employee_can_view_dashboard(): void
    {
        $this->actingAsEmployee();

        $response = $this->get(route('dashboard', absolute: false));

        $response->assertStatus(200);
    }

    public function test_dashboard_contains_required_sections(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->get(route('dashboard', absolute: false));

        $response->assertInertia(fn ($page) => $page
            ->has('stats')
            ->has('role_data')
            ->has('current_projects')
            ->has('recent_activities')
        );
    }

    public function test_dashboard_stats_have_correct_structure(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->get(route('dashboard', absolute: false));

        $response->assertInertia(fn ($page) => $page
            ->whereAllType([
                'stats.active_projects' => 'integer',
                'stats.tasks_due_this_week' => 'integer',
                'stats.pending_reviews' => 'integer',
                'stats.trends' => 'array',
            ])
        );
    }
}
