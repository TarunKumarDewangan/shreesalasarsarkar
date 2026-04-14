<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'role', 'name', 'owner_name', 'finance_name',
        'mobile', 'email', 'password', 'address', 'is_active',
        'financer_id',
    ];

    public function financer()
    {
        return $this->belongsTo(User::class, 'financer_id');
    }

    public function staff()
    {
        return $this->hasMany(User::class, 'financer_id');
    }

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isFinancer(): bool
    {
        return $this->role === 'financer';
    }

    public function isStaff(): bool
    {
        return $this->role === 'staff';
    }

    public function borrowers()
    {
        return $this->hasMany(Borrower::class, 'financer_id');
    }

    public function loans()
    {
        return $this->hasMany(Loan::class, 'financer_id');
    }
}
