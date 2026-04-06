import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** Valid v4-shaped UUID derived from room number so IDs stay stable across re-seeds and pass @IsUUID(). */
function deterministicRoomId(roomNumber: number): string {
  const hex = roomNumber.toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${hex.slice(-12)}`;
}

async function main() {
  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.staffUser.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hotel.deleteMany();

  // Create hotel
  const hotel = await prisma.hotel.create({
    data: {
      name: 'Skylight Hotel',
      slug: 'skylight',
      address: 'Bole, Addis Ababa, Ethiopia',
      phone: '+251-11-667-0000',
    },
  });

  // Create rooms with deterministic IDs so QR codes stay valid across re-seeds
  const roomNumbers = [101, 102, 103, 201, 202, 203, 301, 302];
  const rooms = await Promise.all(
    roomNumbers.map((num) =>
      prisma.room.create({
        data: {
          id: deterministicRoomId(num),
          number: String(num),
          floor: Math.floor(num / 100),
          hotelId: hotel.id,
        },
      }),
    ),
  );

  // Create staff user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.staffUser.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      name: 'Hotel Manager',
      role: 'ADMIN',
      hotelId: hotel.id,
    },
  });

  // Create menu categories and items
  const breakfast = await prisma.menuCategory.create({
    data: {
      name: 'Breakfast',
      nameAm: '\u1240\u1228\u134D \u121D\u130D\u1265',
      sortOrder: 1,
      hotelId: hotel.id,
    },
  });

  const mainDishes = await prisma.menuCategory.create({
    data: {
      name: 'Main Dishes',
      nameAm: '\u12CB\u1293 \u121D\u130D\u1266\u127D',
      sortOrder: 2,
      hotelId: hotel.id,
    },
  });

  const beverages = await prisma.menuCategory.create({
    data: {
      name: 'Beverages',
      nameAm: '\u1218\u1320\u1324\u12EB\u12CE\u127D',
      sortOrder: 3,
      hotelId: hotel.id,
    },
  });

  const desserts = await prisma.menuCategory.create({
    data: {
      name: 'Desserts',
      nameAm: '\u12F5\u12D8\u122D\u1275',
      sortOrder: 4,
      hotelId: hotel.id,
    },
  });

  // Breakfast items
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Firfir with Egg',
        nameAm: '\u134D\u122D\u134D\u122D \u12A8\u12A5\u1295\u1241\u120B\u120D',
        description: 'Shredded injera sauteed in spicy sauce with scrambled egg',
        price: 120,
        imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop',
        categoryId: breakfast.id,
      },
      {
        name: 'Chechebsa',
        nameAm: '\u1328\u1328\u1265\u1233',
        description: 'Flatbread torn and mixed with spiced butter and berbere',
        price: 100,
        imageUrl: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&h=300&fit=crop',
        categoryId: breakfast.id,
      },
      {
        name: 'Kinche',
        nameAm: '\u1245\u1295\u1329',
        description: 'Cracked wheat porridge with butter',
        price: 80,
        imageUrl: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=300&fit=crop',
        categoryId: breakfast.id,
      },
      {
        name: 'Scrambled Eggs & Toast',
        description: 'Classic scrambled eggs with butter toast and jam',
        price: 110,
        imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
        categoryId: breakfast.id,
      },
      {
        name: 'Foul',
        nameAm: '\u134D\u120D',
        description: 'Mashed fava beans with olive oil, tomato, and jalapeno',
        price: 90,
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
        categoryId: breakfast.id,
      },
    ],
  });

  // Main dishes
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Doro Wot',
        nameAm: '\u12F6\u122E \u12C8\u1325',
        description: 'Spicy chicken stew slow-cooked in berbere sauce with boiled egg',
        price: 350,
        imageUrl: 'https://images.unsplash.com/photo-1567982047351-76b6f93e38ee?w=400&h=300&fit=crop',
        categoryId: mainDishes.id,
      },
      {
        name: 'Tibs (Beef)',
        nameAm: '\u1325\u1265\u1235',
        description: 'Sauteed beef cubes with rosemary, onion, and green pepper',
        price: 280,
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
        categoryId: mainDishes.id,
      },
      {
        name: 'Kitfo',
        nameAm: '\u12AD\u1275\u134E',
        description: 'Ethiopian beef tartare seasoned with mitmita and niter kibbeh',
        price: 320,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop',
        categoryId: mainDishes.id,
      },
      {
        name: 'Shiro',
        nameAm: '\u123D\u122E',
        description: 'Chickpea flour stew cooked with berbere and garlic',
        price: 150,
        imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop',
        categoryId: mainDishes.id,
      },
      {
        name: 'Beyaynetu (Fasting Platter)',
        nameAm: '\u1260\u12EB\u12ED\u1290\u1271',
        description: 'Assorted vegan dishes on injera — misir, gomen, shiro, salad',
        price: 220,
        imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop',
        categoryId: mainDishes.id,
      },
      {
        name: 'Grilled Fish (Nile Tilapia)',
        nameAm: '\u12E8\u1270\u1320\u1260\u1230 \u12A0\u1233',
        description: 'Whole tilapia grilled with lemon, garlic, and rosemary',
        price: 300,
        imageUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&h=300&fit=crop',
        categoryId: mainDishes.id,
      },
    ],
  });

  // Beverages
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Buna (Ethiopian Coffee)',
        nameAm: '\u1261\u1293',
        description: 'Traditional Ethiopian coffee ceremony — freshly roasted and brewed',
        price: 60,
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400&h=300&fit=crop',
        categoryId: beverages.id,
      },
      {
        name: 'Macchiato',
        nameAm: '\u121B\u12AA\u12EB\u1276',
        description: 'Ethiopian-style espresso with steamed milk',
        price: 70,
        imageUrl: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&h=300&fit=crop',
        categoryId: beverages.id,
      },
      {
        name: 'Fresh Juice (Spriss)',
        nameAm: '\u1235\u1355\u122A\u1235',
        description: 'Layered fresh avocado, mango, and papaya juice',
        price: 100,
        imageUrl: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=300&fit=crop',
        categoryId: beverages.id,
      },
      {
        name: 'Ambo Water',
        nameAm: '\u12A0\u121D\u1266 \u12CD\u1203',
        description: 'Ethiopian sparkling mineral water',
        price: 40,
        imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop',
        categoryId: beverages.id,
      },
      {
        name: 'Soft Drink',
        description: 'Coca-Cola, Sprite, or Fanta',
        price: 50,
        imageUrl: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400&h=300&fit=crop',
        categoryId: beverages.id,
      },
      {
        name: 'Fresh Tej',
        nameAm: '\u1325\u1305',
        description: 'Traditional Ethiopian honey wine',
        price: 120,
        imageUrl: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=300&fit=crop',
        categoryId: beverages.id,
      },
    ],
  });

  // Desserts
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Baklava',
        description: 'Layered filo pastry with nuts and honey syrup',
        price: 100,
        imageUrl: 'https://images.unsplash.com/photo-1519676867240-f03562e64571?w=400&h=300&fit=crop',
        categoryId: desserts.id,
      },
      {
        name: 'Fruit Platter',
        description: 'Seasonal fresh fruits — papaya, mango, banana, watermelon',
        price: 130,
        imageUrl: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop',
        categoryId: desserts.id,
      },
      {
        name: 'Chocolate Cake',
        description: 'Rich chocolate layer cake with ganache',
        price: 120,
        imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
        categoryId: desserts.id,
      },
    ],
  });

  console.log('Seed completed!');
  console.log(`Hotel: ${hotel.name} (${hotel.id})`);
  console.log(`Rooms: ${rooms.map((r) => r.number).join(', ')}`);
  console.log(`Room 101 ID (for QR testing): ${rooms[0].id}`);
  console.log('Staff login: admin / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
