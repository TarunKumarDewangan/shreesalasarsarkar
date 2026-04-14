<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class UppercaseStringsTest extends TestCase
{
    /**
     * Test that string inputs are converted to uppercase.
     */
    public function test_string_inputs_are_converted_to_uppercase(): void
    {
        Route::post('/test-uppercase', function () {
            return response()->json(request()->all());
        });

        $response = $this->postJson('/test-uppercase', [
            'name' => 'john doe',
            'email' => 'john@example.com',
            'address' => '123 street',
            'password' => 'secret123',
            'username' => 'johndoe77',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'name' => 'JOHN DOE',
            'email' => 'john@example.com', // Excluded
            'address' => '123 STREET',
            'password' => 'secret123', // Excluded
            'username' => 'johndoe77', // Excluded
        ]);
    }
}
