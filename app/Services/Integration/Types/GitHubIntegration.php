<?php

namespace App\Services\Integration\Types;

use App\Models\Integration;
use App\Services\Integration\Contracts\IntegrationInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class GitHubIntegration implements IntegrationInterface
{
    private const API_BASE = 'https://api.github.com';

    public function validateConfig(array $config): array
    {
        $validated = validator($config, [
            'repo' => ['required', 'string', 'regex:/^[\w\-\.]+\/[\w\-\.]+$/'],
            'token' => ['nullable', 'string', 'min:1'],
            'branch' => ['nullable', 'string', 'max:255'],
        ])->validate();

        if (isset($validated['repo']) && !str_contains($validated['repo'], '/')) {
            throw ValidationException::withMessages([
                'repo' => 'Repository must be in format "owner/repo".',
            ]);
        }

        return $validated;
    }

    public function getDisplayData(array $config): array
    {
        $repo = $config['repo'] ?? '';
        $token = $config['token'] ?? null;
        $branch = $config['branch'] ?? 'main';

        [$owner, $repoName] = explode('/', $repo, 2) + ['', ''];

        $headers = ['Accept' => 'application/vnd.github.v3+json'];
        if ($token) {
            $headers['Authorization'] = 'Bearer ' . $token;
        }

        $repoData = [];
        $commits = [];
        $error = null;

        try {
            $repoResponse = Http::withHeaders($headers)
                ->get(self::API_BASE . "/repos/{$repo}");

            if ($repoResponse->successful()) {
                $d = $repoResponse->json();
                $repoData = [
                    'name' => $d['full_name'] ?? $repo,
                    'description' => $d['description'] ?? '',
                    'stars' => $d['stargazers_count'] ?? 0,
                    'forks' => $d['forks_count'] ?? 0,
                    'open_issues' => $d['open_issues_count'] ?? 0,
                    'language' => $d['language'] ?? '',
                    'default_branch' => $d['default_branch'] ?? 'main',
                    'url' => $d['html_url'] ?? "https://github.com/{$repo}",
                ];

                $branch = $repoData['default_branch'];

                $commitsResponse = Http::withHeaders($headers)
                    ->get(self::API_BASE . "/repos/{$repo}/commits", [
                        'sha' => $branch,
                        'per_page' => 5,
                    ]);

                if ($commitsResponse->successful()) {
                    $commits = collect($commitsResponse->json())->map(fn ($c) => [
                        'sha' => substr($c['sha'] ?? '', 0, 7),
                        'message' => explode("\n", $c['commit']['message'] ?? '')[0],
                        'author' => $c['commit']['author']['name'] ?? '',
                        'date' => $c['commit']['author']['date'] ?? '',
                        'url' => $c['html_url'] ?? '',
                    ])->values()->toArray();
                }
            } else {
                $error = 'Repository not found or inaccessible.';
            }
        } catch (\Exception $e) {
            $error = 'Could not connect to GitHub.';
        }

        return [
            'repo' => $repo,
            'repo_data' => $repoData,
            'commits' => $commits,
            'error' => $error,
        ];
    }

    public function getFormFields(): array
    {
        return [
            [
                'key' => 'repo',
                'label' => 'Repository',
                'type' => 'text',
                'placeholder' => 'owner/repo',
                'required' => true,
                'help' => 'Format: owner/repository-name',
            ],
            [
                'key' => 'token',
                'label' => 'Access Token',
                'type' => 'password',
                'required' => false,
                'help' => 'Personal access token with repo:read scope (optional, increases rate limit)',
            ],
            [
                'key' => 'branch',
                'label' => 'Default Branch',
                'type' => 'text',
                'required' => false,
                'placeholder' => 'main',
                'help' => 'Defaults to repository default branch',
            ],
        ];
    }

    public function sync(Integration $integration): void
    {
        $integration->update([
            'label' => $integration->config['repo'] ?? null,
            'last_synced_at' => now(),
        ]);
    }
}
