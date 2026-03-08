import React from 'react';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { 
  BookOpen, ShoppingCart, ChefHat, TrendingUp, Boxes, 
  Brain, Coffee, Home, Printer, Download, CheckCircle2,
  Info, AlertCircle
} from 'lucide-react';

export const InstructionsPage: React.FC = () => {
  const { language } = useAppStore();

  const handlePrint = () => {
    window.print();
  };

  const steps = [
    {
      id: 'setup',
      title: language === 'ka' ? '1. საწყისი მომართვა და შესყიდვები' : '1. Initial Setup & Purchases',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      content: language === 'ka' ? (
        <ul className="list-disc ml-5 space-y-2">
          <li>გადადით <strong>"შესყიდვების"</strong> გვერდზე.</li>
          <li>დაამატეთ პროდუქტები სათითაოდ ან გამოიყენეთ <strong>Excel იმპორტი</strong> დიდი რაოდენობისთვის.</li>
          <li>იმპორტისთვის: ჩამოტვირთეთ ნიმუში (Sample), შეავსეთ მონაცემები და ატვირთეთ ფაილი.</li>
          <li>მიუთითეთ სწორი ერთეულები (კგ, ლიტრი, ცალი) და კატეგორიები.</li>
        </ul>
      ) : (
        <ul className="list-disc ml-5 space-y-2">
          <li>Go to the <strong>"Purchases"</strong> page.</li>
          <li>Add products individually or use <strong>Excel Import</strong> for bulk entries.</li>
          <li>For import: Download the sample file, fill in the data, and upload it.</li>
          <li>Specify correct units (kg, liter, piece) and categories.</li>
        </ul>
      )
    },
    {
      id: 'menu',
      title: language === 'ka' ? '2. მენიუს შედგენა და კალკულაცია' : '2. Menu Creation & Costing',
      icon: ChefHat,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
      content: language === 'ka' ? (
        <ul className="list-disc ml-5 space-y-2">
          <li>გადადით <strong>"მენიუს"</strong> გვერდზე და დაამატეთ ახალი კერძი.</li>
          <li>თითოეულ კერძს გაუწერეთ ინგრედიენტები <strong>"რეცეპტურაში"</strong>.</li>
          <li>მიუთითეთ <strong>დანაკარგის პროცენტი (Loss %)</strong> - მაგალითად, ბოსტნეულის გათლისას ან ხორცის დამუშავებისას.</li>
          <li>პროგრამა ავტომატურად დათვლის თვითღირებულებას ბოლო შესყიდვის ფასების მიხედვით.</li>
        </ul>
      ) : (
        <ul className="list-disc ml-5 space-y-2">
          <li>Go to the <strong>"Menu"</strong> page and add a new dish.</li>
          <li>Define ingredients for each dish in the <strong>"Recipe/BOM"</strong> section.</li>
          <li>Specify <strong>Loss %</strong> - for example, for vegetable peeling or meat processing.</li>
          <li>The software automatically calculates the cost price based on the latest purchase prices.</li>
        </ul>
      )
    },
    {
      id: 'sales',
      title: language === 'ka' ? '3. გაყიდვების აღრიცხვა' : '3. Sales Recording',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      content: language === 'ka' ? (
        <ul className="list-disc ml-5 space-y-2">
          <li>ყოველდღიურად შეიყვანეთ გაყიდული კერძების რაოდენობა <strong>"გაყიდვების"</strong> გვერდზე.</li>
          <li>გაყიდვის დაფიქსირებისთანავე, პროგრამა ავტომატურად <strong>ჩამოწერს</strong> შესაბამის ინგრედიენტებს საწყობიდან.</li>
          <li>შეგიძლიათ ნახოთ გაყიდვების არქივი და ჯამური შემოსავალი თარიღების მიხედვით.</li>
        </ul>
      ) : (
        <ul className="list-disc ml-5 space-y-2">
          <li>Enter the quantity of sold dishes daily on the <strong>"Sales"</strong> page.</li>
          <li>Once a sale is recorded, the software automatically <strong>deducts</strong> the corresponding ingredients from the inventory.</li>
          <li>You can view the sales archive and total revenue filtered by dates.</li>
        </ul>
      )
    },
    {
      id: 'inventory',
      title: language === 'ka' ? '4. ინვენტარიზაცია და აუდიტი' : '4. Inventory & Audit',
      icon: Boxes,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      content: language === 'ka' ? (
        <ul className="list-disc ml-5 space-y-2">
          <li>პერიოდულად ჩაატარეთ ინვენტარიზაცია <strong>"ინვენტარიზაციის"</strong> გვერდზე.</li>
          <li>პროგრამა გაჩვენებთ <strong>"მოსალოდნელ ნაშთს"</strong> (შესყიდვები მინუს გაყიდვები).</li>
          <li>შეიყვანეთ <strong>"ფაქტიური ნაშთი"</strong> (რაც რეალურად გაქვთ საწყობში).</li>
          <li>პროგრამა დათვლის სხვაობას და დაგეხმარებათ დანაკლისის კონტროლში.</li>
        </ul>
      ) : (
        <ul className="list-disc ml-5 space-y-2">
          <li>Periodically conduct inventory counts on the <strong>"Inventory"</strong> page.</li>
          <li>The software shows the <strong>"Expected Balance"</strong> (Purchases minus Sales).</li>
          <li>Enter the <strong>"Actual Balance"</strong> (what you actually have in stock).</li>
          <li>The software calculates the variance and helps you control shortages.</li>
        </ul>
      )
    },
    {
      id: 'breakfast',
      title: language === 'ka' ? '5. საუზმე და ჰაუსქიფინგი' : '5. Breakfast & Housekeeping',
      icon: Coffee,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      content: language === 'ka' ? (
        <ul className="list-disc ml-5 space-y-2">
          <li><strong>საუზმე:</strong> შექმენით მენიუები კვირის დღეების მიხედვით და აღრიცხეთ სტუმრები ოთახების მიხედვით.</li>
          <li><strong>ჰაუსქიფინგი:</strong> მართეთ ოთახების სტატუსი (სუფთა, დასასუფთავებელი) და აღრიცხეთ ჰიგიენური საშუალებების ხარჯვა.</li>
          <li>საუზმისა და ჰაუსქიფინგის პროდუქტები ასევე აისახება საერთო ინვენტარში.</li>
        </ul>
      ) : (
        <ul className="list-disc ml-5 space-y-2">
          <li><strong>Breakfast:</strong> Create menus by days of the week and record guests by room numbers.</li>
          <li><strong>Housekeeping:</strong> Manage room statuses (Clean, Dirty) and record the consumption of hygiene products.</li>
          <li>Breakfast and Housekeeping products are also reflected in the global inventory.</li>
        </ul>
      )
    },
    {
      id: 'ai',
      title: language === 'ka' ? '6. AI ანალიტიკა და დაშბორდი' : '6. AI Analytics & Dashboard',
      icon: Brain,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      content: language === 'ka' ? (
        <ul className="list-disc ml-5 space-y-2">
          <li>მთავარ გვერდზე (Dashboard) ნახავთ ჯამურ მაჩვენებლებს და <strong>AI ანალიზს</strong>.</li>
          <li>პროგრამა გაგაფრთხილებთ თუ: პროდუქტი თავდება, კერძი წამგებიანია, ან დანაკარგი ძალიან მაღალია.</li>
          <li>გამოიყენეთ ეს მონაცემები ბიზნესის ოპტიმიზაციისთვის.</li>
        </ul>
      ) : (
        <ul className="list-disc ml-5 space-y-2">
          <li>On the main Dashboard, you'll see total metrics and <strong>AI Analysis</strong>.</li>
          <li>The software alerts you if: a product is running low, a dish is unprofitable, or waste is too high.</li>
          <li>Use this data to optimize your business operations.</li>
        </ul>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-8 pb-20 print:p-0 print:max-w-none">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 p-2.5 rounded-xl shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t(language, 'instructions')}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t(language, 'instructionsDesc')}</p>
          </div>
        </div>
        
        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          <Printer className="w-4 h-4 mr-2" />
          {language === 'ka' ? 'ბეჭდვა / PDF' : 'Print / PDF'}
        </button>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block mb-10 border-b-2 border-slate-900 pb-6">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
          {language === 'ka' ? 'პროგრამის გამოყენების ინსტრუქცია' : 'Software Usage Instructions'}
        </h1>
        <p className="text-slate-500 mt-2 font-medium">HORECA Cost Control System - Step-by-Step Guide</p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 gap-8">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div 
              key={step.id} 
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-all group print:shadow-none print:border-slate-200 print:rounded-none print:p-6"
            >
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className={`p-4 rounded-2xl shrink-0 border transition-transform group-hover:scale-110 ${step.bg} ${step.color} border-current/10 print:scale-100`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-gray-900 mb-4 tracking-tight flex items-center">
                    {step.title}
                    <CheckCircle2 className="w-5 h-5 ml-2 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                  </h3>
                  <div className="text-slate-600 leading-relaxed text-base">
                    {step.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pro Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:mt-10">
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex items-start gap-4">
          <div className="bg-indigo-600 p-2 rounded-lg shrink-0">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-indigo-900 mb-1">პროფესიონალური რჩევა</h4>
            <p className="text-sm text-indigo-800/80 leading-relaxed">
              ყოველთვის მიუთითეთ ზუსტი დანაკარგის პროცენტი (Loss %). ეს არის ყველაზე ხშირი მიზეზი, რის გამოც ფაქტიური და მოსალოდნელი ნაშთები ერთმანეთს არ ემთხვევა.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4">
          <div className="bg-amber-600 p-2 rounded-lg shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 mb-1">უსაფრთხოება</h4>
            <p className="text-sm text-amber-800/80 leading-relaxed">
              პერიოდულად გააკეთეთ მონაცემების ექსპორტი Excel-ში. ეს დაგეხმარებათ გქონდეთ სარეზერვო ასლი და აწარმოოთ დამატებითი ანალიზი.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="mt-12 bg-slate-900 rounded-3xl p-10 text-center text-white relative overflow-hidden print:bg-white print:text-slate-900 print:border-t-2 print:border-slate-200 print:rounded-none">
        <div className="relative z-10">
          <p className="text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            {language === 'ka' 
              ? 'ეს პროგრამა შექმნილია თქვენი რესტორნის მომგებიანობის გაზრდისა და ხარჯების ოპტიმიზაციისთვის. ნებისმიერი კითხვის შემთხვევაში, მიმართეთ ადმინისტრაციას.' 
              : 'This software is designed to increase your restaurant\'s profitability and optimize costs. For any questions, please contact the administration.'}
          </p>
          <div className="mt-6 flex justify-center items-center space-x-2 text-slate-400 text-sm font-bold uppercase tracking-widest print:text-slate-500">
            <span>HORECA COST CONTROL</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full" />
            <span>v2.5</span>
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-slate-800 rounded-full opacity-50 blur-3xl pointer-events-none print:hidden" />
      </div>

      {/* Print-only Footer */}
      <div className="hidden print:block mt-10 text-center text-xs text-slate-400">
        Generated on {new Date().toLocaleDateString()} - HORECA Cost Control System
      </div>
    </div>
  );
};
