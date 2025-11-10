import { AdminService } from "../app/service/admin.service";

export const makeAmountWithFee = async (ammount: number) => {
  const adminCommissionPercentage = await AdminService.adminCommission();

  return ammount * (adminCommissionPercentage / 100);
};
