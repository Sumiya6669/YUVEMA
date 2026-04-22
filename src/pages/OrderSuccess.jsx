import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderNum = urlParams.get('order');

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20">
      <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
      <h1 className="text-3xl font-serif font-bold mb-3">Спасибо за заказ!</h1>
      {orderNum && <p className="text-muted-foreground mb-2">Номер заказа: <span className="font-mono font-medium text-foreground">{orderNum}</span></p>}
      <p className="text-muted-foreground mb-8 max-w-md">
        Мы свяжемся с вами для подтверждения заказа. Информация отправлена на вашу почту.
      </p>
      <div className="flex gap-4">
        <Link to="/catalog"><Button variant="outline" className="rounded-full px-6">Продолжить покупки</Button></Link>
        <Link to="/account"><Button className="rounded-full px-6">Мои заказы</Button></Link>
      </div>
    </div>
  );
}