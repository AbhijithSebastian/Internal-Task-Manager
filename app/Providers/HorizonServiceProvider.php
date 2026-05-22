<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonApplicationServiceProvider;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    public function boot(): void
    {
        parent::boot();

        Horizon::auth(function ($request) {
            return Gate::allows('viewHorizon', [$request->user()]);
        });
    }

    protected function gate(): void
    {
        Gate::define('viewHorizon', function ($user) {
            return $user->hasRole('super-admin');
        });
    }
}
