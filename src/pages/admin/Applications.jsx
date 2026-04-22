import React, { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  Mail,
  MessageSquareText,
  Phone,
  UserRoundSearch,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/services/api/client";
import {
  applicationStatusLabels,
  formatDate,
  getApplicationStatusClass,
  roleLabels,
} from "@/pages/admin/adminUtils";

export default function Applications() {
  const queryClient = useQueryClient();

  const { data: applications = [] } = useQuery({
    queryKey: ["admin-b2b-applications"],
    queryFn: () => apiClient.entities.B2BApplication.list("-created_date", 200),
    initialData: [],
  });

  const { data: contactMessages = [] } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: () => apiClient.entities.ContactMessage.list("-created_date", 200),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiClient.entities.User.list("-created_date", 500),
    initialData: [],
  });

  const stats = useMemo(
    () => [
      {
        icon: UserRoundSearch,
        label: "Новые заявки",
        value: applications.filter((item) => item.status === "pending").length,
        note: "Требуют решения по B2B-доступу",
      },
      {
        icon: Building2,
        label: "Одобрено",
        value: applications.filter((item) => item.status === "approved").length,
        note: `${users.filter((user) => user.role === "b2b_client").length} профилей уже переведены в B2B`,
      },
      {
        icon: MessageSquareText,
        label: "Сообщения с сайта",
        value: contactMessages.length,
        note: "Входящие с контактной формы",
      },
      {
        icon: Mail,
        label: "Лиды с email",
        value: contactMessages.filter((item) => item.email).length,
        note: "Можно быстро связаться без доп. запроса",
      },
    ],
    [applications, contactMessages, users],
  );

  async function updateApplication(application, status) {
    const matchedUser = users.find(
      (user) => user.email?.toLowerCase() === application.email?.toLowerCase(),
    );

    if (status === "approved" && matchedUser) {
      await apiClient.entities.User.update(matchedUser.id, {
        role: "b2b_client",
        wholesale_approved: true,
        company_name: application.company,
        company_bin: application.bin,
        city: application.city,
        phone: application.phone,
        full_name: application.name || matchedUser.full_name,
      });
    }

    await apiClient.entities.B2BApplication.update(application.id, { status });
    queryClient.invalidateQueries({ queryKey: ["admin-b2b-applications"] });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });

    if (status === "approved" && !matchedUser) {
      toast.success(
        "Заявка одобрена. B2B-роль будет назначена после регистрации пользователя с этим email.",
      );
      return;
    }

    toast.success(
      status === "approved" ? "Заявка одобрена" : "Заявка обновлена",
    );
  }

  return (
    <div className="space-y-6">
      <div className="premium-panel px-7 py-7">
        <p className="text-[10px] uppercase tracking-[0.24em] text-primary">Лиды и партнёры</p>
        <h1 className="mt-4 font-serif text-[2.5rem] leading-none text-stone">
          B2B-заявки и сообщения
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-8 text-muted-foreground">
          В этом разделе удобно принимать B2B-партнёров, обновлять их статус и оперативно
          разбирать входящие обращения с сайта.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FBF0E3] shadow-soft">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-stone">{stat.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stat.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="applications" className="space-y-5">
        <TabsList className="h-auto rounded-full bg-[#F4ECE2] p-1">
          <TabsTrigger
            value="applications"
            className="rounded-full px-5 py-2.5 data-[state=active]:bg-white"
          >
            B2B заявки
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="rounded-full px-5 py-2.5 data-[state=active]:bg-white"
          >
            Сообщения
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-3">
          {applications.map((application) => {
            const matchedUser = users.find(
              (user) => user.email?.toLowerCase() === application.email?.toLowerCase(),
            );

            return (
              <Card key={application.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-stone">{application.company}</p>
                        <Badge
                          variant="outline"
                          className={getApplicationStatusClass(application.status)}
                        >
                          {applicationStatusLabels[application.status] || application.status}
                        </Badge>
                        {matchedUser && (
                          <Badge variant="secondary">
                            Профиль найден: {roleLabels[matchedUser.role] || matchedUser.role}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-4">
                        <Info label="Контакт" value={application.name} />
                        <Info label="Email" value={application.email} />
                        <Info label="Телефон" value={application.phone} />
                        <Info label="Город" value={application.city} />
                        <Info label="БИН" value={application.bin} />
                        <Info
                          label="Дата"
                          value={formatDate(application.created_date, "dd.MM.yyyy HH:mm")}
                        />
                      </div>

                      {application.message && (
                        <div className="mt-4 rounded-[1rem] border border-[#EEE2D6] bg-[#FFFCF8] px-4 py-4 text-sm leading-relaxed text-stone">
                          {application.message}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateApplication(application, "approved")}
                        disabled={application.status === "approved"}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Одобрить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateApplication(application, "rejected")}
                        disabled={application.status === "rejected"}
                      >
                        <XCircle className="h-4 w-4" />
                        Отклонить
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {applications.length === 0 && (
            <div className="premium-panel px-8 py-14 text-center">
              <p className="font-serif text-[2rem] text-stone">Заявок пока нет</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Когда клиенты начнут отправлять B2B-запросы, они появятся здесь.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-3">
          {contactMessages.map((message) => (
            <Card key={message.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-stone">
                        {message.name || "Без имени"}
                      </p>
                      <Badge variant="secondary">Контактная форма</Badge>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                      <Info label="Email" value={message.email} />
                      <Info label="Телефон" value={message.phone} />
                      <Info
                        label="Дата"
                        value={formatDate(message.created_date, "dd.MM.yyyy HH:mm")}
                      />
                    </div>

                    <div className="mt-4 rounded-[1rem] border border-[#EEE2D6] bg-[#FFFCF8] px-4 py-4 text-sm leading-relaxed text-stone">
                      {message.message}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {message.email && (
                      <Button asChild size="sm" variant="outline">
                        <a href={`mailto:${message.email}`}>
                          <Mail className="h-4 w-4" />
                          Ответить
                        </a>
                      </Button>
                    )}
                    {message.phone && (
                      <Button asChild size="sm" variant="outline">
                        <a href={`tel:${message.phone}`}>
                          <Phone className="h-4 w-4" />
                          Позвонить
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {contactMessages.length === 0 && (
            <div className="premium-panel px-8 py-14 text-center">
              <p className="font-serif text-[2rem] text-stone">Сообщений пока нет</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Входящие с формы появятся здесь, как только кто-то напишет через сайт.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-1 text-sm text-stone">{value || "—"}</p>
    </div>
  );
}
