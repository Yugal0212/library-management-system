import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ItemType, UserRole, ItemStatus, LoanStatus } from '../src/common/enums';

const prisma = new PrismaClient();

async function seed() {
  try {
    // Create first admin user
    const hashedPassword = await bcrypt.hash('admin@123', 10);
    await prisma.user.upsert({
      where: { email: 'jakasaniyayugal@gmail.com' },
      update: {},
      create: {
        email: 'jakasaniyayugal@gmail.com',
        name: 'Admin User',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isVerified: true,
        isActive: true,
    }});

    // Create second admin user for testing
    const hashedPassword2 = await bcrypt.hash('admin@456', 10);
    await prisma.user.upsert({
      where: { email: 'admin@edulibrary.com' },
      update: {},
      create: {
        email: 'admin@edulibrary.com',
        name: 'System Administrator',
        password: hashedPassword2,
        role: UserRole.ADMIN,
        isVerified: true,
        isActive: true,
    }});

    // Create librarian user
    const hashedPasswordLib = await bcrypt.hash('lib@123', 10);
    await prisma.user.upsert({
      where: { email: 'librarian@edulibrary.com' },
      update: {},
      create: {
        email: 'librarian@edulibrary.com',
        name: 'Head Librarian',
        password: hashedPasswordLib,
        role: UserRole.LIBRARIAN,
        isVerified: true,
        isActive: true,
    }});

    // Create categories
    const categories = [
      { name: 'Fiction', description: 'Fiction books including novels and stories' },
      { name: 'Education', description: 'Educational and academic books' },
      { name: 'Science', description: 'Scientific and research materials' },
      { name: 'Technology', description: 'Books about programming, computers, and technology' },
      { name: 'Business', description: 'Business, management, and entrepreneurship books' },
      { name: 'Self-Help', description: 'Personal development and self-improvement books' },
      { name: 'History', description: 'Historical books and documentaries' },
      { name: 'Biography', description: 'Biographies and autobiographies' },
      { name: 'Reference', description: 'Reference books and encyclopedias' },
    ];

    const createdCategories = {};
    for (const category of categories) {
      const created = await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      });
      createdCategories[category.name] = created.id;
    }

    // Create sample books
    const books = [
      {
        uniqueItemId: 'BOOK-001',
        title: 'The Great Gatsby',
        type: 'BOOK',
        metadata: {
          author: 'F. Scott Fitzgerald',
          isbn: '978-0743273565',
          publisher: 'Scribner',
          publishYear: 1925,
          pages: 180,
          language: 'English',
          edition: 'First Edition',
        },
        categories: ['Fiction'],
        barcode: 'GB001',
        description: 'A classic novel about American society in the 1920s',
      },
      {
        uniqueItemId: 'BOOK-002',
        title: 'Introduction to Algorithms',
        type: 'BOOK',
        metadata: {
          author: 'Thomas H. Cormen',
          isbn: '978-0262033848',
          publisher: 'MIT Press',
          publishYear: 2009,
          pages: 1312,
          language: 'English',
          edition: 'Third Edition',
        },
        categories: ['Education', 'Science', 'Technology'],
        barcode: 'ALGO001',
        description: 'Comprehensive introduction to algorithms',
      },
      {
        uniqueItemId: 'BOOK-003',
        title: 'Clean Code',
        type: 'BOOK',
        metadata: {
          author: 'Robert C. Martin',
          isbn: '978-0132350884',
          publisher: 'Prentice Hall',
          publishYear: 2008,
          pages: 464,
          language: 'English',
          edition: 'First Edition',
        },
        categories: ['Technology', 'Education'],
        barcode: 'CC001',
        description: 'A handbook of agile software craftsmanship',
      },
      {
        uniqueItemId: 'BOOK-004',
        title: 'Steve Jobs',
        type: 'BOOK',
        metadata: {
          author: 'Walter Isaacson',
          isbn: '978-1451648539',
          publisher: 'Simon & Schuster',
          publishYear: 2011,
          pages: 656,
          language: 'English',
          edition: 'First Edition',
        },
        categories: ['Biography', 'Technology', 'Business'],
        barcode: 'SJ001',
        description: 'The exclusive biography of Steve Jobs',
      },
      {
        uniqueItemId: 'BOOK-005',
        title: 'Atomic Habits',
        type: 'BOOK',
        metadata: {
          author: 'James Clear',
          isbn: '978-0735211292',
          publisher: 'Penguin Random House',
          publishYear: 2018,
          pages: 320,
          language: 'English',
          edition: 'First Edition',
        },
        categories: ['Self-Help', 'Business'],
        barcode: 'AH001',
        description: 'An easy & proven way to build good habits & break bad ones',
      },
      {
        uniqueItemId: 'BOOK-006',
        title: 'A Brief History of Time',
        type: 'BOOK',
        metadata: {
          author: 'Stephen Hawking',
          isbn: '978-0553380163',
          publisher: 'Bantam',
          publishYear: 1988,
          pages: 212,
          language: 'English',
          edition: 'Updated Edition',
        },
        categories: ['Science', 'Education'],
        barcode: 'BHT001',
        description: 'From the Big Bang to Black Holes',
      },
      {
        uniqueItemId: 'BOOK-007',
        title: 'The Art of War',
        type: 'BOOK',
        metadata: {
          author: 'Sun Tzu',
          isbn: '978-1590302255',
          publisher: 'Shambhala',
          publishYear: 2005,
          pages: 224,
          language: 'English',
          edition: 'Illustrated Edition',
        },
        categories: ['History', 'Business', 'Reference'],
        barcode: 'AW001',
        description: 'Ancient wisdom on the art of warfare',
      },
      {
        uniqueItemId: 'BOOK-008',
        title: 'Python Crash Course',
        type: 'BOOK',
        metadata: {
          author: 'Eric Matthes',
          isbn: '978-1593279288',
          publisher: 'No Starch Press',
          publishYear: 2019,
          pages: 544,
          language: 'English',
          edition: 'Second Edition',
        },
        categories: ['Technology', 'Education'],
        barcode: 'PCC001',
        description: 'A hands-on, project-based introduction to programming',
      },
      {
        uniqueItemId: 'BOOK-009',
        title: 'Think and Grow Rich',
        type: 'BOOK',
        metadata: {
          author: 'Napoleon Hill',
          isbn: '978-1585424337',
          publisher: 'Tarcher',
          publishYear: 2005,
          pages: 320,
          language: 'English',
          edition: 'Revised Edition',
        },
        categories: ['Business', 'Self-Help'],
        barcode: 'TGR001',
        description: 'The landmark bestseller on wealth creation',
      },
      {
        uniqueItemId: 'BOOK-010',
        title: 'Data Science for Beginners',
        type: 'BOOK',
        metadata: {
          author: 'Sarah Johnson',
          isbn: '978-1234567890',
          publisher: 'Tech Press',
          publishYear: 2024,
          pages: 400,
          language: 'English',
          edition: 'First Edition',
        },
        categories: ['Technology', 'Science', 'Education'],
        barcode: 'DS001',
        description: 'A comprehensive guide to data science and machine learning',
      },
    ];

    for (const book of books) {
      // Create the library item
      const createdBook = await prisma.libraryItem.upsert({
        where: { uniqueItemId: book.uniqueItemId },
        update: {},
        create: {
          uniqueItemId: book.uniqueItemId,
          title: book.title,
          type: ItemType.BOOK,
          publishedAt: new Date(book.metadata.publishYear, 0, 1),
          description: book.description,
          isbn: book.metadata.isbn,
          barcode: book.barcode,
          language: book.metadata.language || 'English',
          location: `${book.categories[0]} Section`,
          metadata: book.metadata,
          status: ItemStatus.AVAILABLE,
        },
      });

      // Link categories
      for (const categoryName of book.categories) {
        const category = await prisma.category.findUnique({
          where: { name: categoryName },
        });
        if (category) {
          // Use upsert to avoid duplicate constraint errors
          await prisma.itemCategory.upsert({
            where: {
              itemId_categoryId: {
                itemId: createdBook.id,
                categoryId: category.id,
              },
            },
            update: {},
            create: {
              itemId: createdBook.id,
              categoryId: category.id,
            },
          });
        }
      }
    }

    // Create dummy loans and fines for the existing patron user
    const patronUserId = 'cmf98rnz00006w8o4h1zep8m2'; // yugaljakasaniya02@gmail.com
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: patronUserId }
    });

    if (existingUser) {
      console.log('Creating dummy loans and fines for user:', existingUser.email);
      
      // Get some books to create loans for
      const books = await prisma.libraryItem.findMany({
        where: { type: ItemType.BOOK },
        take: 5
      });

      const today = new Date();
      
      // Create overdue loans (past due dates)
      const overdueLoan1 = await prisma.loan.create({
        data: {
          userId: patronUserId,
          itemId: books[0].id,
          loanDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          dueDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days overdue
          status: LoanStatus.BORROWED,
        }
      });

      const overdueLoan2 = await prisma.loan.create({
        data: {
          userId: patronUserId,
          itemId: books[1].id,
          loanDate: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
          dueDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
          status: LoanStatus.BORROWED,
        }
      });

      // Create a loan due soon (not overdue yet)
      const dueSoonLoan = await prisma.loan.create({
        data: {
          userId: patronUserId,
          itemId: books[2].id,
          loanDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // due in 2 days
          status: LoanStatus.BORROWED,
        }
      });

      // Create a returned loan (with late return)
      const returnedLoan = await prisma.loan.create({
        data: {
          userId: patronUserId,
          itemId: books[3].id,
          loanDate: new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
          dueDate: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000), // was due 20 days ago
          returnDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000), // returned 15 days ago (5 days late)
          status: LoanStatus.RETURNED,
        }
      });

      // Create fines for overdue items
      await prisma.fine.create({
        data: {
          userId: patronUserId,
          loanId: overdueLoan1.id,
          amount: 15.00, // $15 for 10 days overdue ($1.50 per day)
          reason: 'Late return fee - 10 days overdue',
          status: 'PENDING',
        }
      });

      await prisma.fine.create({
        data: {
          userId: patronUserId,
          loanId: overdueLoan2.id,
          amount: 7.50, // $7.50 for 5 days overdue
          reason: 'Late return fee - 5 days overdue',
          status: 'PENDING',
        }
      });

      await prisma.fine.create({
        data: {
          userId: patronUserId,
          loanId: returnedLoan.id,
          amount: 7.50, // $7.50 for the late return that was already returned
          reason: 'Late return fee - returned 5 days late',
          status: 'PENDING',
        }
      });

      // Create a current active loan (not overdue)
      const activeLoan = await prisma.loan.create({
        data: {
          userId: patronUserId,
          itemId: books[4].id,
          loanDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          dueDate: new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000), // due in 9 days
          status: LoanStatus.BORROWED,
        }
      });

      console.log('Dummy loans and fines created successfully!');
      console.log('- Overdue loans: 2');
      console.log('- Active loans: 2');  
      console.log('- Returned loans: 1');
      console.log('- Pending fines: 3');
      console.log('- Total fine amount: $30.00');
    } else {
      console.log('Patron user not found with ID:', patronUserId);
    }

    console.log('Seed data created successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
