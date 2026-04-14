<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('financer_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('father_name')->nullable();
            $table->string('mobile', 20)->nullable();
            $table->string('mobile2', 20)->nullable();
            $table->string('aadhar', 20)->nullable();
            $table->string('pan', 20)->nullable();
            $table->date('dob')->nullable();
            $table->text('address')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Unique within a financer's scope for mobile/aadhar
            $table->index(['financer_id', 'mobile']);
            $table->index(['financer_id', 'aadhar']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
