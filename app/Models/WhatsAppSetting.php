<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WhatsAppSetting extends Model
{
    use HasFactory;

    protected $table = 'whatsapp_settings';

    protected $fillable = [
        'user_id',
        'instance_id',
        'access_token',
        'is_active',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
