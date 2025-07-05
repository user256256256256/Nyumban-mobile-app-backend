/*
  Warnings:

  - The `energy_efficiency_features` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `amenities` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `open_house_dates` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "properties" DROP COLUMN "energy_efficiency_features",
ADD COLUMN     "energy_efficiency_features" TEXT[],
DROP COLUMN "amenities",
ADD COLUMN     "amenities" TEXT[],
DROP COLUMN "open_house_dates",
ADD COLUMN     "open_house_dates" TEXT[];
