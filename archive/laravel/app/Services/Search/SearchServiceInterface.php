<?php

namespace App\Services\Search;

use Illuminate\Support\Collection;

interface SearchServiceInterface
{
    public function search(string $query, array $types = ['all']): array;
    public function searchTasks(string $query): Collection;
    public function searchProjects(string $query): Collection;
    public function searchUsers(string $query): Collection;
    public function searchComments(string $query): Collection;
}
