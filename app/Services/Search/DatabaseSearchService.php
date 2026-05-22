<?php

namespace App\Services\Search;

use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Collection;

class DatabaseSearchService implements SearchServiceInterface
{
    public function search(string $query, array $types = ['all']): array
    {
        $results = [];

        if (in_array('all', $types) || in_array('tasks', $types)) {
            $results['tasks'] = $this->searchTasks($query);
        }
        if (in_array('all', $types) || in_array('projects', $types)) {
            $results['projects'] = $this->searchProjects($query);
        }
        if (in_array('all', $types) || in_array('users', $types)) {
            $results['users'] = $this->searchUsers($query);
        }
        if (in_array('all', $types) || in_array('comments', $types)) {
            $results['comments'] = $this->searchComments($query);
        }

        return $results;
    }

    public function searchTasks(string $query): Collection
    {
        return Task::whereNull('parent_id')
            ->search($query)
            ->with(['project:id,name'])
            ->limit(5)
            ->get(['id', 'title', 'project_id', 'status', 'tags']);
    }

    public function searchProjects(string $query): Collection
    {
        return Project::search($query)
            ->limit(5)
            ->get(['id', 'name', 'status']);
    }

    public function searchUsers(string $query): Collection
    {
        return User::search($query)
            ->active()
            ->limit(5)
            ->get(['id', 'name', 'email', 'job_title', 'avatar_url']);
    }

    public function searchComments(string $query): Collection
    {
        return Comment::search($query)
            ->with(['task:id,title', 'author:id,name'])
            ->limit(5)
            ->get(['id', 'body', 'task_id', 'author_id', 'created_at']);
    }
}
