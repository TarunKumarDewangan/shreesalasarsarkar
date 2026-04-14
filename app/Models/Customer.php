<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'financer_id', 'folio_no', 'name', 'father_name', 'mobile', 'mobile2', 'aadhar', 'pan', 'dob', 'address'
    ];

    public function borrowers()
    {
        return $this->hasMany(Borrower::class);
    }
}
