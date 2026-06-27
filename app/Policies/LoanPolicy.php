<?php

namespace App\Policies;

use App\Models\Loan;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class LoanPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny($user): bool
    {
        if (!$user instanceof User) return false;
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view($user, Loan $loan): bool
    {
        if (!$user instanceof User) return false;
        if ($user->isAdmin()) return true;
        
        $effectiveOwnerId = $user->isStaff() ? $user->financer_id : $user->id;
        return $loan->financer_id === $effectiveOwnerId;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create($user): bool
    {
        if (!$user instanceof User) return false;
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update($user, Loan $loan): bool
    {
        if (!$user instanceof User) return false;
        return $this->view($user, $loan);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete($user, Loan $loan): bool
    {
        if (!$user instanceof User) return false;
        return $this->view($user, $loan);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore($user, Loan $loan): bool
    {
        if (!$user instanceof User) return false;
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete($user, Loan $loan): bool
    {
        if (!$user instanceof User) return false;
        return false;
    }
}
