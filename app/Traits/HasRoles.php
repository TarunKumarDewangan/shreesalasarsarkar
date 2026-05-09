<?php

namespace App\Traits;

trait HasRoles
{
    public function isAdmin(): bool
    {
        return false;
    }

    public function isFinancer(): bool
    {
        return false;
    }

    public function isStaff(): bool
    {
        return false;
    }

    public function isBorrower(): bool
    {
        return false;
    }
}
