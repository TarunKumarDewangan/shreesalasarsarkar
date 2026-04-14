<?php

namespace App\Services;

use App\Models\WhatsAppSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * Send a WhatsApp message using Iconic Solution API.
     * 
     * @param string $mobile Number with country code (e.g., 919876543210)
     * @param string $message
     * @param int|null $financerId The ID of the financer whose settings to use
     * @return array
     */
    public function sendMessage($mobile, $message, $financerId = null)
    {
        // If financerId is provided, get their specific settings
        // Otherwise, maybe fallback to admin or current user? 
        // For now, we expect financerId.
        
        $settings = WhatsAppSetting::where('user_id', $financerId)
            ->where('is_active', true)
            ->first();

        if (!$settings) {
            // Fallback to Admin settings
            $admin = \App\Models\User::where('role', 'admin')->first();
            if ($admin) {
                $settings = WhatsAppSetting::where('user_id', $admin->id)
                    ->where('is_active', true)
                    ->first();
            }
        }

        if (!$settings || !$settings->instance_id || !$settings->access_token) {
            return [
                'success' => false,
                'message' => 'WhatsApp API settings not found for this branch or fallback admin.'
            ];
        }

        // Clean and format mobile number
        $mobile = preg_replace('/[^0-9]/', '', $mobile);
        if (strlen($mobile) === 10) {
            $mobile = '91' . $mobile;
        }

        try {
            // Updated to official Iconic Solution endpoint from documentation
            $url = "https://api.iconicsolution.co.in/wapp/v2/api/send";

            // Using asMultipart() to match the documentation's --form example
            $response = Http::asMultipart()->post($url, [
                'apikey' => $settings->access_token,
                'mobile' => $mobile,
                'msg'    => $message,
            ]);

            $body = $response->json();
            Log::info('WhatsApp API Response: ', ['status' => $response->status(), 'body' => $body]);

            // Check for success condition in response body (some APIs return 200 but body has error)
            $isInternalSuccess = ($body['status'] ?? '') === 'success' || ($body['statuscode'] ?? 0) === 200;

            if ($response->successful() && $isInternalSuccess) {
                return [
                    'success' => true,
                    'data' => $body,
                ];
            }

            return [
                'success' => false,
                'message' => 'API Error: ' . ($body['msg'] ?? $response->body() ?: 'Unknown error'),
                'status' => $response->status(),
                'details' => $body
            ];
        } catch (\Exception $e) {
            Log::error('WhatsApp API Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Exception: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Test the WhatsApp API connection.
     */
    public function testConnection($instanceId, $accessToken, $mobile)
    {
        // Clean and format mobile number
        $mobile = preg_replace('/[^0-9]/', '', $mobile);
        if (strlen($mobile) === 10) {
            $mobile = '91' . $mobile;
        }

        try {
            $url = "https://api.iconicsolution.co.in/wapp/v2/api/send";
            $message = "Test message from Shree Salasar Sarkar Finance Solution.";

            $response = Http::asMultipart()->post($url, [
                'apikey' => $accessToken,
                'mobile' => $mobile,
                'msg'    => $message,
            ]);

            $body = $response->json();
            Log::info('WhatsApp Test Connection Response: ', ['status' => $response->status(), 'body' => $body]);

            // Check for success condition in response body
            $isInternalSuccess = ($body['status'] ?? '') === 'success' || ($body['statuscode'] ?? 0) === 200;

            if ($response->successful() && $isInternalSuccess) {
                return [
                    'success' => true,
                    'data' => $body,
                ];
            }

            return [
                'success' => false,
                'message' => 'API Error: ' . ($body['msg'] ?? $response->body() ?: 'Unknown error'),
                'status' => $response->status(),
                'details' => $body
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Exception: ' . $e->getMessage(),
            ];
        }
    }
}
