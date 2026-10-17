import LeadForm from "./components/LeadForm";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-50 font-sans">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold tracking-tight text-neutral-900">
            Кварта
          </span>
          <span className="text-sm text-neutral-500">Обжарка кофе · Минск</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          Свежая обжарка — на ваш стол
        </h1>
        <p className="mt-3 max-w-xl text-neutral-600">
          Обжариваем партиями по 5 кг и развозим по Минску. Оставьте заявку —
          менеджер перезвонит и поможет выбрать.
        </p>

        <div className="mt-8 max-w-xl">
          <LeadForm />
        </div>
      </main>
    </div>
  );
}
