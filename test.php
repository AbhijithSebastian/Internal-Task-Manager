<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
try {
    $kernel->handle(new Symfony\Component\Console\Input\ArrayInput(['command' => 'package:discover']), new Symfony\Component\Console\Output\ConsoleOutput());
} catch (\Throwable $e) {
    echo "ORIGINAL ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
