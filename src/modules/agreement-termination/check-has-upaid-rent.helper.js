const checkHasUpaidRentHelper = async (agreementId) => {
  const unpaidRent = await prisma.rent_payments.findFirst({
    where: {
      rental_agreement_id: agreementId,
      status: { in: ['pending', 'overdued', 'partial'] },
      is_deleted: false,
    },
  });

  return !unpaidRent;
};

export default checkHasUpaidRentHelper;  
