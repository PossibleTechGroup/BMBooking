const prisma = require('../lib/prisma');

const WalletService = {
  getWallet: async (doctorId) => {
    return await prisma.wallet.findUnique({
      where: { doctorId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });
  },

  createWallet: async (doctorId) => {
    return await prisma.wallet.create({
      data: { doctorId, balance: 0 }
    });
  },

  creditWallet: async (doctorId, amount, description) => {
    return await prisma.$transaction(async (tx) => {
      // Get or Create Wallet
      let wallet = await tx.wallet.findUnique({ where: { doctorId } });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { doctorId, balance: 0 } });
      }

      // Update Balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } }
      });

      // Create Transaction Record
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'CREDIT',
          description
        }
      });

      return updatedWallet;
    });
  },

  requestWithdrawal: async (doctorId, amount, bankDetails) => {
    const wallet = await prisma.wallet.findUnique({ where: { doctorId } });
    if (!wallet || wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    return await prisma.withdrawalRequest.create({
      data: {
        walletId: wallet.id,
        amount,
        status: 'pending',
        ...bankDetails
      }
    });
  }
};

module.exports = WalletService;
