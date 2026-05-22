<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use App\Services\Search\SearchServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(
        private readonly SearchServiceInterface $searchService
    ) {}

    public function search(Request $request): JsonResponse
    {
        $term = $request->get('q', '');
        $type = $request->get('type', 'all');

        $results = $this->searchService->search(
            $term,
            $type === 'all' ? ['all'] : [$type]
        );

        return response()->json($results);
    }

    public function users(Request $request): JsonResponse
    {
        $term = $request->get('q', '');

        return response()->json(
            User::search($term)->active()->limit(10)->get(['id', 'name', 'email'])
        );
    }

    public function projects(Request $request): JsonResponse
    {
        $term = $request->get('q', '');

        return response()->json(
            Project::search($term)->active()->limit(10)->get(['id', 'name', 'status'])
        );
    }
}
