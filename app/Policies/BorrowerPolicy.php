<?php

namespace App\Policies;

use App\Models\Borrower;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class BorrowerPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Filtering is handled in the controller query
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Borrower $borrower): bool
    {
        if ($user->isAdmin()) return true;
        
        $effectiveOwnerId = $user->isStaff() ? $user->financer_id : $user->id;
        return $borrower->financer_id === $effectiveOwnerId;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Borrower $borrower): bool
    {
        return $this->view($user, $borrower);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Borrower $borrower): bool
    {
        return $this->view($user, $borrower);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Borrower $borrower): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Borrower $borrower): bool
    {
        return false;
    }
}
