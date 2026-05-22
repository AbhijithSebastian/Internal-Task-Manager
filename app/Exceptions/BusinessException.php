<?php

namespace App\Exceptions;

use App\Helpers\HttpStatus;
use RuntimeException;

class BusinessException extends RuntimeException
{
    public function __construct(
        string $message = 'Business rule violation',
        protected readonly string $publicMessage = '',
        protected readonly array $context = [],
        int $code = 0,
        ?\Throwable $previous = null
    ) {
        $code = $code ?: HttpStatus::UNPROCESSABLE_ENTITY;
        parent::__construct($message, $code, $previous);
    }

    public function getPublicMessage(): string
    {
        return $this->publicMessage ?: $this->message;
    }

    public function getContext(): array
    {
        return $this->context;
    }

    public function render(): \Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse
    {
        if (request()->expectsJson()) {
            return response()->json([
                'message' => $this->getPublicMessage(),
                'context' => $this->context,
            ], $this->code);
        }

        return redirect()->back()
            ->withInput()
            ->with('error', $this->getPublicMessage());
    }
}
