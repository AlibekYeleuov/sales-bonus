/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
    // @TODO: Расчет выручки от операции
function calculateSimpleRevenue(purchase, _product) {
    // purchase — это одна из записей в поле items из чека в data.purchase_records
   // _product — это продукт из коллекции data.products
    const {discount, sale_price, quantity} = purchase;
    const finalDiscount = 1 - (discount / 100);
   return sale_price * quantity * finalDiscount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */

    // @TODO: Расчет бонуса от позиции в рейтинге
function calculateBonusByProfit(index, total, seller) {
    const max_bonus = 0.15;
    const high_bonus = 0.1;
    const low_bonus = 0.05;
    const min_bonus = 0;
    if (index === 0) {
        return seller.profit * max_bonus;
    }
    else if (index === 1 || index === 2) {
        return seller.profit * high_bonus;
    }
    else if (index === total - 1) {
        return seller.profit * min_bonus;
    }
    else {
        return seller.profit * low_bonus;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
        if (
            !data
            || !Array.isArray(data.sellers) || data.sellers.length === 0
            || !Array.isArray(data.products) || data.products.length === 0
            || !Array.isArray(data.customers) || data.customers.length === 0
            || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
        ) {
            throw new Error('Некорректные входные данные');
        }

        const { calculateRevenue, calculateBonus } = options;

    // @TODO: Проверка наличия опций
        if (!options || typeof options !== "object") {
            throw new Error('Некорректые опции')
        }
        if (!calculateRevenue || !calculateBonus) {
            throw new Error('Чего-то не хватает')
        }
        if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
            throw new Error('Переменные не функции')
        }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        "id": seller.id,
        "name": seller.first_name + " " + seller.last_name, //check if valid later
        "revenue": 0,
        "profit": 0,
        "sales_count": 0,
        "top_products": {},
        "products_sales": {},
        "bonus": 0

    }));

    const productsStats = data.products.map(product => ({
        "name": product.name,
        "category": product.category,
        "sku": product.sku,
        "purchase_price": product.purchase_price,
        "sale_price": product.sale_price
    }))

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = sellerStats.reduce((acc, obj) => ({
        ...acc,
        [obj.id]: obj
    }), {}
    )

    const productIndex = productsStats.reduce((acc, obj) => ({
        ...acc,
        [obj.sku]: obj
    }), {}
    )

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count++;
        seller.revenue += record.total_amount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item, product);
            const profit = revenue - cost;
            seller.profit += profit;
            if (!seller.products_sales[item.sku]) {
                seller.products_sales[item.sku] = 0;
            }
            seller.products_sales[item.sku] += item.quantity;
        })
    })

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((sel1, sel2) => {
        if (sel1.profit > sel2.profit) {
            return -1;
        }
        else if (sel1.profit < sel2.profit) {
            return 1;
        }
        else {
            return 0;
        }
    })
    

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
        seller.products_sales = Object.entries(seller.products_sales).map(item => item);
        seller.products_sales.sort((pr1, pr2) => {
            if (pr1[1] > pr2[1]) {
                return -1;
            }
            else if (pr1[1] < pr2[1]) {
                return 1;
            }
            else {
                return 0;
            }
        })
        seller.products_sales = seller.products_sales.slice(0, 10);
    })

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.products_sales.map(product => ({sku: product[0], quantity: product[1]})),
        bonus: +seller.bonus.toFixed(2)
    }))
}