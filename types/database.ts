
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "habit_logs": {
                  Row: {
                    "completed_at": string,"created_at": string,"habit_id": string,"id": string,"scheduled_date": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string,"created_at"?: string,"habit_id": string,"id"?: string,"scheduled_date": string,"user_id": string
                  }
                  Update: {
                    "completed_at"?: string,"created_at"?: string,"habit_id"?: string,"id"?: string,"scheduled_date"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "habit_logs_habit_id_fkey"
      columns: ["habit_id"]
isOneToOne: false
      referencedRelation: "habits"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "habit_logs_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"habits": {
                  Row: {
                    "color": string,"created_at": string,"description": string | null,"frequency": Database["public"]['Enums']["habit_frequency"],"icon": string,"id": string,"is_active": boolean,"reminder_time": string | null,"title": string,"updated_at": string,"user_id": string,"weekdays": (number)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string,"created_at"?: string,"description"?: string | null,"frequency"?: Database["public"]['Enums']["habit_frequency"],"icon"?: string,"id"?: string,"is_active"?: boolean,"reminder_time"?: string | null,"title": string,"updated_at"?: string,"user_id": string,"weekdays"?: (number)[]
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"description"?: string | null,"frequency"?: Database["public"]['Enums']["habit_frequency"],"icon"?: string,"id"?: string,"is_active"?: boolean,"reminder_time"?: string | null,"title"?: string,"updated_at"?: string,"user_id"?: string,"weekdays"?: (number)[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "habits_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount": number,"created_at": string,"gateway_order_id": string,"gateway_transaction_id": string | null,"id": string,"paid_at": string | null,"plan_id": string,"status": Database["public"]['Enums']["payment_status"],"subscription_id": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"gateway_order_id": string,"gateway_transaction_id"?: string | null,"id"?: string,"paid_at"?: string | null,"plan_id": string,"status"?: Database["public"]['Enums']["payment_status"],"subscription_id"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"gateway_order_id"?: string,"gateway_transaction_id"?: string | null,"id"?: string,"paid_at"?: string | null,"plan_id"?: string,"status"?: Database["public"]['Enums']["payment_status"],"subscription_id"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_subscription_id_fkey"
      columns: ["subscription_id"]
isOneToOne: false
      referencedRelation: "subscriptions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"plans": {
                  Row: {
                    "code": string,"created_at": string,"features": NonNullable<Json>,"id": string,"interval": Database["public"]['Enums']["plan_interval"],"is_active": boolean,"limits": NonNullable<Json>,"name": string,"price": number,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"features"?: NonNullable<Json>,"id"?: string,"interval"?: Database["public"]['Enums']["plan_interval"],"is_active"?: boolean,"limits"?: NonNullable<Json>,"name": string,"price": number,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"features"?: NonNullable<Json>,"id"?: string,"interval"?: Database["public"]['Enums']["plan_interval"],"is_active"?: boolean,"limits"?: NonNullable<Json>,"name"?: string,"price"?: number,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"push_subscriptions": {
                  Row: {
                    "auth": string,"created_at": string,"endpoint": string,"id": string,"last_used_at": string | null,"p256dh": string,"revoked_at": string | null,"user_agent": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auth": string,"created_at"?: string,"endpoint": string,"id"?: string,"last_used_at"?: string | null,"p256dh": string,"revoked_at"?: string | null,"user_agent"?: string | null,"user_id": string
                  }
                  Update: {
                    "auth"?: string,"created_at"?: string,"endpoint"?: string,"id"?: string,"last_used_at"?: string | null,"p256dh"?: string,"revoked_at"?: string | null,"user_agent"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_subscriptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"reminders": {
                  Row: {
                    "channel": Database["public"]['Enums']["reminder_channel"],"created_at": string,"error": string | null,"habit_id": string,"id": string,"scheduled_at": string,"sent_at": string | null,"status": Database["public"]['Enums']["reminder_status"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "channel": Database["public"]['Enums']["reminder_channel"],"created_at"?: string,"error"?: string | null,"habit_id": string,"id"?: string,"scheduled_at": string,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["reminder_status"],"user_id": string
                  }
                  Update: {
                    "channel"?: Database["public"]['Enums']["reminder_channel"],"created_at"?: string,"error"?: string | null,"habit_id"?: string,"id"?: string,"scheduled_at"?: string,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["reminder_status"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reminders_habit_id_fkey"
      columns: ["habit_id"]
isOneToOne: false
      referencedRelation: "habits"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reminders_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"subscriptions": {
                  Row: {
                    "canceled_at": string | null,"created_at": string,"current_period_end": string | null,"current_period_start": string | null,"gateway_subscription_id": string | null,"id": string,"plan_id": string,"status": Database["public"]['Enums']["subscription_status"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "canceled_at"?: string | null,"created_at"?: string,"current_period_end"?: string | null,"current_period_start"?: string | null,"gateway_subscription_id"?: string | null,"id"?: string,"plan_id": string,"status"?: Database["public"]['Enums']["subscription_status"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "canceled_at"?: string | null,"created_at"?: string,"current_period_end"?: string | null,"current_period_start"?: string | null,"gateway_subscription_id"?: string | null,"id"?: string,"plan_id"?: string,"status"?: Database["public"]['Enums']["subscription_status"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscriptions_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "plans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "subscriptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"tasks": {
                  Row: {
                    "completed_at": string | null,"created_at": string,"due_at": string | null,"id": string,"is_completed": boolean,"notes": string | null,"priority": Database["public"]['Enums']["task_priority"],"title": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"created_at"?: string,"due_at"?: string | null,"id"?: string,"is_completed"?: boolean,"notes"?: string | null,"priority"?: Database["public"]['Enums']["task_priority"],"title": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "completed_at"?: string | null,"created_at"?: string,"due_at"?: string | null,"id"?: string,"is_completed"?: boolean,"notes"?: string | null,"priority"?: Database["public"]['Enums']["task_priority"],"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"users": {
                  Row: {
                    "created_at": string,"default_reminder_time": string | null,"email": string,"email_reminders": boolean,"goal": string | null,"id": string,"name": string,"notification_permission": string,"onboarding_completed_at": string | null,"role": Database["public"]['Enums']["user_role"],"theme": string,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"default_reminder_time"?: string | null,"email": string,"email_reminders"?: boolean,"goal"?: string | null,"id": string,"name"?: string,"notification_permission"?: string,"onboarding_completed_at"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"theme"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"default_reminder_time"?: string | null,"email"?: string,"email_reminders"?: boolean,"goal"?: string | null,"id"?: string,"name"?: string,"notification_permission"?: string,"onboarding_completed_at"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"theme"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"webhook_events": {
                  Row: {
                    "created_at": string,"error": string | null,"event_key": string,"event_type": string,"id": string,"payload": NonNullable<Json>,"processed_at": string | null,"provider": string,"status": Database["public"]['Enums']["webhook_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"error"?: string | null,"event_key": string,"event_type": string,"id"?: string,"payload": NonNullable<Json>,"processed_at"?: string | null,"provider"?: string,"status"?: Database["public"]['Enums']["webhook_status"]
                  }
                  Update: {
                    "created_at"?: string,"error"?: string | null,"event_key"?: string,"event_type"?: string,"id"?: string,"payload"?: NonNullable<Json>,"processed_at"?: string | null,"provider"?: string,"status"?: Database["public"]['Enums']["webhook_status"]
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_metrics":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"enqueue_due_reminders":
{ Args: { "p_window_end": string,"p_window_start": string }; Returns: number
                           }
          }
          Enums: {
            "habit_frequency": "daily"|"weekdays","payment_status": "pending"|"paid"|"failed"|"expired"|"refunded","plan_interval": "month","reminder_channel": "web_push"|"email","reminder_status": "pending"|"sent"|"failed"|"skipped","subscription_status": "pending"|"active"|"past_due"|"canceled"|"expired","task_priority": "low"|"medium"|"high","user_role": "user"|"admin","webhook_status": "received"|"processed"|"failed"|"ignored"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "habit_frequency": ["daily", "weekdays"],"payment_status": ["pending", "paid", "failed", "expired", "refunded"],"plan_interval": ["month"],"reminder_channel": ["web_push", "email"],"reminder_status": ["pending", "sent", "failed", "skipped"],"subscription_status": ["pending", "active", "past_due", "canceled", "expired"],"task_priority": ["low", "medium", "high"],"user_role": ["user", "admin"],"webhook_status": ["received", "processed", "failed", "ignored"]
          }
        }
} as const
