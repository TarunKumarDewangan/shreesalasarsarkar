<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;

class Borrower extends Model
{
    use SoftDeletes, HasApiTokens;
    protected $fillable = [
        'financer_id', 'customer_id', 'recovery_man_id', 'folio_prefix', 'folio_no', 'zone', 'collection_day',
        'name', 'father_name', 'mobile', 'mobile2', 'aadhar', 'pan', 'dob', 'address',
        'photo', 'aadhar_photo',
        'otp', 'otp_expires_at'
    ];

    public static function syncCustomer(Borrower $borrower): void
    {
        $customerData = [
            'financer_id' => $borrower->financer_id,
            'folio_no'    => $borrower->folio_no,
            'name'        => $borrower->name,
            'father_name' => $borrower->father_name,
            'mobile'      => $borrower->mobile,
            'mobile2'     => $borrower->mobile2,
            'aadhar'      => $borrower->aadhar,
            'pan'         => $borrower->pan,
            'dob'         => $borrower->dob,
            'address'     => $borrower->address,
        ];

        $customer = null;

        $customer = Customer::where('financer_id', $borrower->financer_id)
            ->where('name', $borrower->name)
            ->where('mobile', $borrower->mobile)
            ->where('folio_no', $borrower->folio_no)
            ->first();

        if (!$customer && $borrower->aadhar) {
            $customer = Customer::where('financer_id', $borrower->financer_id)
                ->where('aadhar', $borrower->aadhar)
                ->first();
        }

        if ($customer) {
            $customer->update($customerData);
        } else {
            $customer = Customer::create($customerData);
        }

        $borrower->update(['customer_id' => $customer->id]);
    }

    public function recoveryMan()
    {
        return $this->belongsTo(User::class, 'recovery_man_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function financer()
    {
        return $this->belongsTo(User::class, 'financer_id');
    }

    public function guarantor()
    {
        return $this->hasOne(Guarantor::class);
    }

    public function vehicle()
    {
        return $this->hasOne(Vehicle::class);
    }

    public function loans()
    {
        return $this->hasMany(Loan::class);
    }

    public function latestLoan()
    {
        return $this->hasOne(Loan::class)->latestOfMany();
    }

    public function getFolioDisplayAttribute(): string
    {
        return $this->folio_prefix . '-' . $this->folio_no;
    }
    /**
     * The "booted" method of the model.
     */
    protected static function booted()
    {
        static::deleted(function ($borrower) {
            $borrower->vehicle()->delete();
            $borrower->guarantor()->delete();
            $borrower->loans()->delete();
        });

        static::restored(function ($borrower) {
            $borrower->vehicle()->restore();
            $borrower->guarantor()->restore();
            $borrower->loans()->restore();
        });
    }
}
