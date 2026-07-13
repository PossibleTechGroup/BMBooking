const prisma = require('../lib/prisma');

const PaymentMethodService = {
  listMethods: async (doctorId) => {
    return await prisma.paymentMethod.findMany({
      where: { doctorId },
      orderBy: { createdAt: 'desc' }
    });
  },

  addMethod: async (doctorId, data) => {
    return await prisma.$transaction(async (tx) => {
      // If it's the first method, make it primary
      const count = await tx.paymentMethod.count({ where: { doctorId } });
      const isPrimary = count === 0 || data.isPrimary;

      if (isPrimary) {
        await tx.paymentMethod.updateMany({
          where: { doctorId },
          data: { isPrimary: false }
        });
      }

      return await tx.paymentMethod.create({
        data: {
          ...data,
          doctorId,
          isPrimary
        }
      });
    });
  },

  updateMethod: async (id, doctorId, data) => {
    return await prisma.$transaction(async (tx) => {
      const method = await tx.paymentMethod.findUnique({ where: { id } });
      if (!method || method.doctorId !== doctorId) {
        throw new Error('Payment method not found');
      }

      if (data.isPrimary) {
        await tx.paymentMethod.updateMany({
          where: { doctorId },
          data: { isPrimary: false }
        });
      }

      return await tx.paymentMethod.update({
        where: { id },
        data
      });
    });
  },

  deleteMethod: async (id, doctorId) => {
    const method = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!method || method.doctorId !== doctorId) {
      throw new Error('Payment method not found');
    }

    if (method.isPrimary) {
      throw new Error('Cannot delete primary payment method. Set another as primary first.');
    }

    return await prisma.paymentMethod.delete({ where: { id } });
  },

  setPrimary: async (id, doctorId) => {
    return await prisma.$transaction(async (tx) => {
      await tx.paymentMethod.updateMany({
        where: { doctorId },
        data: { isPrimary: false }
      });

      return await tx.paymentMethod.update({
        where: { id, doctorId },
        data: { isPrimary: true }
      });
    });
  }
};

module.exports = PaymentMethodService;
