import { AdminService } from "../app/service/admin.service";

export const makeAmountWithFee = async (ammount: number,adminCommission:number | undefined) => {
  const adminCommissionPercentage = adminCommission || await AdminService.adminCommission();

  return ammount * (adminCommissionPercentage / 100);
};
