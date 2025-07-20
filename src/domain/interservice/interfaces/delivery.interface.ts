export interface Delivery {
  id: number;
  order_id: number;
  user_id: number;
  transport_mode_id: number;
  delivery_status_id: number;
  verification_code: string;
  start_time: Date;
  end_time: Date | null;
}