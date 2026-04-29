<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Admin account
        User::firstOrCreate(
            ['email' => 'admin@shreesalasar.com'],
            [
                'role' => 'admin',
                'name' => 'System Administrator',
                'finance_name' => 'Shree Salasar Sarkar HQ',
                'mobile' => '7898108422',
                'password' => Hash::make('admin123'),
                'address' => 'Dhamtari, C.G.',
            ]
        );

        // Sample financer (Guddu)
        User::firstOrCreate(
            ['email' => 'guddu@shreesalasar.com'],
            [
                'role' => 'financer',
                'name' => 'Guddu',
                'owner_name' => 'Guddu Sahu',
                'finance_name' => 'Shree Salasar Sarkar (Guddu)',
                'mobile' => '9425204738',
                'password' => Hash::make('guddu123'),
                'address' => 'Dhamtari, C.G.',
            ]
        );

        // Sample financer (Bhanu)
        User::firstOrCreate(
            ['email' => 'bhanu@shreesalasar.com'],
            [
                'role' => 'financer',
                'name' => 'Bhanu',
                'owner_name' => 'Bhanu Sahu',
                'finance_name' => 'Shree Salasar Sarkar (Bhanu)',
                'mobile' => '9827226081',
                'password' => Hash::make('bhanu123'),
                'address' => 'Dhamtari, C.G.',
            ]
        );
    }
}
