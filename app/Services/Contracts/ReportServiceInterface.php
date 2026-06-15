<?php

namespace App\Services\Contracts;

interface ReportServiceInterface
{
    public function taskCompletion(array $filters = []): \Illuminate\Support\Collection;
    public function workloadDistribution(array $filters = []): \Illuminate\Support\Collection;
    public function weeklySummary(array $filters = []): \Illuminate\Support\Collection;
    public function meetingLogs(array $filters = []): \Illuminate\Support\Collection;
}
